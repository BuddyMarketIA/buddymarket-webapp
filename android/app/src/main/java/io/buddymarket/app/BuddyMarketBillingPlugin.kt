package io.buddymarket.app

import android.app.Activity
import com.android.billingclient.api.*
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.*

/**
 * BuddyMarketBillingPlugin
 *
 * Capacitor plugin that bridges Google Play Billing 7 to the WebView JavaScript layer.
 * Mirrors the API surface of BuddyMarketIAPPlugin.swift (StoreKit 2) so the frontend
 * can use a single unified hook (usePayment.ts) on both platforms.
 *
 * Product IDs (must match Google Play Console → Subscriptions):
 *   io.buddymarket.app.premium.monthly
 *   io.buddymarket.app.premium.annual
 *   io.buddymarket.app.promax.monthly
 *   io.buddymarket.app.promax.annual
 */
@CapacitorPlugin(name = "BuddyMarketBilling")
class BuddyMarketBillingPlugin : Plugin(), PurchasesUpdatedListener {

    private lateinit var billingClient: BillingClient
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Pending call waiting for purchase result
    private var pendingPurchaseCall: PluginCall? = null

    // ── Lifecycle ────────────────────────────────────────────────────────────

    override fun load() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build()
        connectBillingClient()
    }

    private fun connectBillingClient() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    android.util.Log.e("BuddyMarketBilling", "Billing setup failed: ${result.debugMessage}")
                }
            }
            override fun onBillingServiceDisconnected() {
                // Retry connection after a short delay
                scope.launch {
                    delay(2000)
                    connectBillingClient()
                }
            }
        })
    }

    // ── JS-callable methods ───────────────────────────────────────────────────

    /**
     * getProducts({ productIds: string[] })
     * Returns product details (title, description, price) for the given IDs.
     */
    @PluginMethod
    fun getProducts(call: PluginCall) {
        val idsArray = call.getArray("productIds") ?: run {
            call.reject("productIds is required")
            return
        }
        val ids = (0 until idsArray.length()).map { idsArray.getString(it) }
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(ids.map { id ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            })
            .build()

        scope.launch {
            val result = billingClient.queryProductDetails(params)
            if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                call.reject("Failed to query products: ${result.billingResult.debugMessage}")
                return@launch
            }
            val products = JSONArray()
            result.productDetailsList?.forEach { detail ->
                val obj = JSONObject()
                obj.put("productId", detail.productId)
                obj.put("title", detail.title)
                obj.put("description", detail.description)
                // Get pricing from the first subscription offer
                val offer = detail.subscriptionOfferDetails?.firstOrNull()
                val pricingPhase = offer?.pricingPhases?.pricingPhaseList?.firstOrNull()
                obj.put("price", pricingPhase?.formattedPrice ?: "")
                obj.put("priceAmountMicros", pricingPhase?.priceAmountMicros ?: 0)
                obj.put("priceCurrencyCode", pricingPhase?.priceCurrencyCode ?: "")
                obj.put("offerToken", offer?.offerToken ?: "")
                products.put(obj)
            }
            call.resolve(JSObject().put("products", products))
        }
    }

    /**
     * purchase({ productId: string })
     * Launches the Google Play purchase flow for the given subscription product.
     */
    @PluginMethod
    fun purchase(call: PluginCall) {
        val productId = call.getString("productId") ?: run {
            call.reject("productId is required")
            return
        }

        // First get product details to obtain the offer token
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            ))
            .build()

        scope.launch {
            val result = billingClient.queryProductDetails(params)
            if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK ||
                result.productDetailsList.isNullOrEmpty()) {
                call.reject("Product not found: $productId")
                return@launch
            }
            val productDetails = result.productDetailsList!![0]
            val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken ?: ""

            val productDetailsParamsList = listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offerToken)
                    .build()
            )
            val billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build()

            pendingPurchaseCall = call
            val activity: Activity = activity ?: run {
                call.reject("Activity not available")
                return@launch
            }
            // Must be called on main thread
            withContext(Dispatchers.Main) {
                billingClient.launchBillingFlow(activity, billingFlowParams)
            }
        }
    }

    /**
     * restorePurchases()
     * Queries active subscriptions and returns them.
     */
    @PluginMethod
    fun restorePurchases(call: PluginCall) {
        scope.launch {
            val params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
            val result = billingClient.queryPurchasesAsync(params)
            val purchases = JSONArray()
            result.purchasesList.forEach { purchase ->
                val obj = JSONObject()
                obj.put("purchaseToken", purchase.purchaseToken)
                obj.put("orderId", purchase.orderId ?: "")
                obj.put("products", JSONArray(purchase.products))
                obj.put("purchaseState", purchase.purchaseState)
                obj.put("isAcknowledged", purchase.isAcknowledged)
                purchases.put(obj)
            }
            call.resolve(JSObject().put("purchases", purchases))
        }
    }

    // ── PurchasesUpdatedListener ──────────────────────────────────────────────

    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        val call = pendingPurchaseCall ?: return
        pendingPurchaseCall = null

        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchase = purchases?.firstOrNull() ?: run {
                    call.reject("No purchase returned")
                    return
                }
                // Acknowledge the purchase
                scope.launch {
                    if (!purchase.isAcknowledged) {
                        val ackParams = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.purchaseToken)
                            .build()
                        billingClient.acknowledgePurchase(ackParams)
                    }
                }
                val obj = JSObject()
                obj.put("purchaseToken", purchase.purchaseToken)
                obj.put("orderId", purchase.orderId ?: "")
                obj.put("products", purchase.products.joinToString(","))
                obj.put("purchaseState", purchase.purchaseState)
                call.resolve(obj)
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                call.reject("Purchase cancelled by user", "USER_CANCELLED")
            }
            else -> {
                call.reject("Purchase failed: ${result.debugMessage}", result.responseCode.toString())
            }
        }
    }
}
