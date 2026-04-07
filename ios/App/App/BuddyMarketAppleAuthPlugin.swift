/**
 * BuddyMarketAppleAuthPlugin.swift
 *
 * Capacitor plugin that bridges Sign in with Apple (AuthenticationServices)
 * to the WebView JavaScript layer.
 *
 * Exposes `window.BuddyMarketAppleAuth` with:
 *   - signIn(nonce?)  → { identityToken, authorizationCode, user?, email?, fullName? }
 *
 * The JS layer then calls POST /api/auth/apple with the identityToken.
 *
 * Apple compliance:
 *   - Uses ASAuthorizationAppleIDProvider (iOS 13+)
 *   - Nonce is SHA-256 hashed before sending to Apple (raw nonce sent to server)
 *   - Full name and email are only available on first sign-in
 */

import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

// ─── Plugin ───────────────────────────────────────────────────────────────────

@objc(BuddyMarketAppleAuthPlugin)
public class BuddyMarketAppleAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    public let identifier = "BuddyMarketAppleAuthPlugin"
    public let jsName = "BuddyMarketAppleAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?
    private var rawNonce: String?

    // ── isAvailable ────────────────────────────────────────────────────────────

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    // ── signIn ─────────────────────────────────────────────────────────────────

    @objc func signIn(_ call: CAPPluginCall) {
        self.pendingCall = call

        // Generate a cryptographically secure nonce
        let nonce = randomNonceString()
        self.rawNonce = nonce

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    // ── ASAuthorizationControllerPresentationContextProviding ─────────────────

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return self.bridge?.viewController?.view.window ?? UIWindow()
    }

    // ── ASAuthorizationControllerDelegate ─────────────────────────────────────

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = pendingCall else { return }
        defer { pendingCall = nil; rawNonce = nil }

        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Invalid credential type")
            return
        }

        guard let identityTokenData = appleIDCredential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            call.reject("Failed to get identity token")
            return
        }

        guard let authCodeData = appleIDCredential.authorizationCode,
              let authorizationCode = String(data: authCodeData, encoding: .utf8) else {
            call.reject("Failed to get authorization code")
            return
        }

        var result: [String: Any] = [
            "identityToken": identityToken,
            "authorizationCode": authorizationCode,
            "user": appleIDCredential.user,
            "nonce": rawNonce ?? "",
        ]

        // Email and full name are only provided on first sign-in
        if let email = appleIDCredential.email {
            result["email"] = email
        }

        if let fullName = appleIDCredential.fullName {
            var nameDict: [String: String] = [:]
            if let givenName = fullName.givenName { nameDict["givenName"] = givenName }
            if let familyName = fullName.familyName { nameDict["familyName"] = familyName }
            if !nameDict.isEmpty { result["fullName"] = nameDict }
        }

        call.resolve(result)
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        guard let call = pendingCall else { return }
        defer { pendingCall = nil; rawNonce = nil }

        let authError = error as? ASAuthorizationError
        if authError?.code == .canceled {
            call.reject("popup_closed_by_user")
        } else {
            call.reject("Apple Sign In failed: \(error.localizedDescription)")
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        if errorCode != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
        }
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        let nonce = randomBytes.map { byte in
            charset[Int(byte) % charset.count]
        }
        return String(nonce)
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap { String(format: "%02x", $0) }.joined()
        return hashString
    }
}
