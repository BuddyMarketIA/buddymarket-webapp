/**
 * Wearables OAuth Routes
 *
 * Endpoints REST para manejar los callbacks de OAuth de Oura y Whoop
 * Estos endpoints intercambian códigos por tokens y guardan las conexiones
 */

import type { Express, Request, Response } from 'express';
import { TRPCError } from '@trpc/server';
import {
  generateOuraAuthUrl,
  generateWhoopAuthUrl,
  exchangeOuraCode,
  exchangeWhoopCode,
  getOuraUser,
  getWhoopUser,
  generateState,
  validateState,
  encryptToken,
} from './wearables-oauth';
import * as db from '../db';
import { ENV } from './env';

/**
 * Registra las rutas de OAuth para wearables
 */
export function registerWearablesRoutes(app: Express) {
  // ─── Oura OAuth Routes ────────────────────────────────────────────────────

  /**
   * GET /api/health-hub/oauth/oura/authorize
   * Genera la URL de autorización para Oura
   */
  app.get('/api/health-hub/oauth/oura/authorize', (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const state = generateState();
      // Guardar state en sesión o base de datos para validar en callback
      req.session.ouraState = state;
      req.session.ouraUserId = userId;

      const authUrl = generateOuraAuthUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Oura auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  /**
   * GET /api/health-hub/oauth/oura/callback
   * Callback de OAuth para Oura
   */
  app.get('/api/health-hub/oauth/oura/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Validar error del usuario
      if (error) {
        return res.redirect(`/health-hub?error=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
      }

      // Validar state para CSRF protection
      const storedState = req.session.ouraState as string;
      if (!storedState || !validateState(state, storedState)) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const userId = req.session.ouraUserId as string;
      if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
      }

      // Intercambiar código por token
      const token = await exchangeOuraCode(code);

      // Obtener información del usuario
      const ouraUser = await getOuraUser(token.accessToken);

      // Encriptar token antes de guardar
      const encryptionKey = ENV.encryptionKey;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY no está configurado');
      }

      const encryptedAccessToken = encryptToken(token.accessToken, encryptionKey);
      const encryptedRefreshToken = token.refreshToken
        ? encryptToken(token.refreshToken, encryptionKey)
        : null;

      // Guardar conexión en BD
      await db.createWearableConnection({
        userId,
        device: 'oura',
        externalId: ouraUser.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: token.expiresAt,
        metadata: {
          email: ouraUser.email,
          age: ouraUser.age,
          weight: ouraUser.weight,
          height: ouraUser.height,
          biologicalSex: ouraUser.biological_sex,
        },
      });

      // Limpiar sesión
      delete req.session.ouraState;
      delete req.session.ouraUserId;

      // Redirigir a Health Hub con éxito
      res.redirect('/health-hub?success=oura_connected');
    } catch (error) {
      console.error('Error in Oura callback:', error);
      res.redirect(`/health-hub?error=${encodeURIComponent('Failed to connect Oura')}`);
    }
  });

  // ─── Whoop OAuth Routes ───────────────────────────────────────────────────

  /**
   * GET /api/health-hub/oauth/whoop/authorize
   * Genera la URL de autorización para Whoop
   */
  app.get('/api/health-hub/oauth/whoop/authorize', (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const state = generateState();
      // Guardar state en sesión o base de datos para validar en callback
      req.session.whoopState = state;
      req.session.whoopUserId = userId;

      const authUrl = generateWhoopAuthUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Whoop auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  /**
   * GET /api/health-hub/oauth/whoop/callback
   * Callback de OAuth para Whoop
   */
  app.get('/api/health-hub/oauth/whoop/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Validar error del usuario
      if (error) {
        return res.redirect(`/health-hub?error=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state' });
      }

      // Validar state para CSRF protection
      const storedState = req.session.whoopState as string;
      if (!storedState || !validateState(state, storedState)) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const userId = req.session.whoopUserId as string;
      if (!userId) {
        return res.status(400).json({ error: 'User ID not found in session' });
      }

      // Intercambiar código por token
      const token = await exchangeWhoopCode(code);

      // Obtener información del usuario
      const whoopUser = await getWhoopUser(token.accessToken);

      // Encriptar token antes de guardar
      const encryptionKey = ENV.encryptionKey;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY no está configurado');
      }

      const encryptedAccessToken = encryptToken(token.accessToken, encryptionKey);
      const encryptedRefreshToken = token.refreshToken
        ? encryptToken(token.refreshToken, encryptionKey)
        : null;

      // Guardar conexión en BD
      await db.createWearableConnection({
        userId,
        device: 'whoop',
        externalId: whoopUser.user_id.toString(),
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: token.expiresAt,
        metadata: {
          email: whoopUser.email,
          firstName: whoopUser.first_name,
          lastName: whoopUser.last_name,
        },
      });

      // Limpiar sesión
      delete req.session.whoopState;
      delete req.session.whoopUserId;

      // Redirigir a Health Hub con éxito
      res.redirect('/health-hub?success=whoop_connected');
    } catch (error) {
      console.error('Error in Whoop callback:', error);
      res.redirect(`/health-hub?error=${encodeURIComponent('Failed to connect Whoop')}`);
    }
  });
}
