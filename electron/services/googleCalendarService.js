const { google } = require('googleapis');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class GoogleCalendarService {
    constructor(db) {
        this.db = db;
        this.oauth2Client = null;
        this.calendar = null;
        this.initializeOAuth();
    }

    initializeOAuth() {
        // OAuth2 client will be initialized when user provides credentials
        // or when loading existing config from database
        const config = this.db.getGoogleCalendarConfig();
        if (config && config.is_enabled) {
            this.setupOAuthClient(config);
        }
    }

    setupOAuthClient(config = null) {
        // For now, we'll use a placeholder for credentials
        // User will need to provide their own OAuth credentials from Google Cloud Console
        const credentials = this.loadCredentials();

        if (!credentials) {
            return null;
        }

        this.oauth2Client = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            credentials.redirect_uri || 'urn:ietf:wg:oauth:2.0:oob'
        );

        if (config && config.access_token) {
            this.oauth2Client.setCredentials({
                access_token: config.access_token,
                refresh_token: config.refresh_token,
                expiry_date: new Date(config.token_expiry).getTime()
            });
        }

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        return this.oauth2Client;
    }

    loadCredentials() {
        try {
            const credPath = path.join(app.getPath('userData'), 'google_credentials.json');
            if (fs.existsSync(credPath)) {
                const data = fs.readFileSync(credPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading Google credentials:', error);
        }
        return null;
    }

    saveCredentials(credentials) {
        try {
            const credPath = path.join(app.getPath('userData'), 'google_credentials.json');
            fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving Google credentials:', error);
            return false;
        }
    }

    getAuthUrl() {
        if (!this.oauth2Client) {
            this.setupOAuthClient();
        }

        if (!this.oauth2Client) {
            throw new Error('OAuth client not initialized. Please provide Google credentials first.');
        }

        const scopes = ['https://www.googleapis.com/auth/calendar'];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    async authenticateWithCode(code) {
        if (!this.oauth2Client) {
            throw new Error('OAuth client not initialized');
        }

        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Save tokens to database
            const expiryDate = new Date(tokens.expiry_date).toISOString();
            this.db.saveGoogleCalendarConfig(
                tokens.access_token,
                tokens.refresh_token,
                expiryDate,
                'primary' // Use primary calendar by default
            );

            this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
            return true;
        } catch (error) {
            console.error('Error authenticating with code:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        if (!this.oauth2Client) {
            return false;
        }

        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            const expiryDate = new Date(credentials.expiry_date).toISOString();
            this.db.updateGoogleCalendarTokens(credentials.access_token, expiryDate);
            return true;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return false;
        }
    }

    async createEvent(reservation) {
        if (!this.calendar) {
            return null;
        }

        try {
            const event = {
                summary: `${reservation.client_name} - ${reservation.pc_name}`,
                description: `Gaming reservation for ${reservation.client_name}\nPC: ${reservation.pc_name}\n${reservation.notes || ''}`,
                start: {
                    dateTime: reservation.start_time,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: reservation.end_time,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                colorId: '10', // Green color in Google Calendar
            };

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });

            return response.data.id;
        } catch (error) {
            console.error('Error creating Google Calendar event:', error);
            if (error.code === 401) {
                // Token expired, try to refresh
                await this.refreshAccessToken();
                // Retry once
                try {
                    const response = await this.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event,
                    });
                    return response.data.id;
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                    return null;
                }
            }
            return null;
        }
    }

    async updateEvent(googleEventId, reservation) {
        if (!this.calendar || !googleEventId) {
            return false;
        }

        try {
            const event = {
                summary: `${reservation.client_name} - ${reservation.pc_name}`,
                description: `Gaming reservation for ${reservation.client_name}\nPC: ${reservation.pc_name}\n${reservation.notes || ''}`,
                start: {
                    dateTime: reservation.start_time,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: reservation.end_time,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                colorId: '10',
            };

            await this.calendar.events.update({
                calendarId: 'primary',
                eventId: googleEventId,
                resource: event,
            });

            return true;
        } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            return false;
        }
    }

    async deleteEvent(googleEventId) {
        if (!this.calendar || !googleEventId) {
            return false;
        }

        try {
            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: googleEventId,
            });
            return true;
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            return false;
        }
    }

    disconnect() {
        this.db.disableGoogleCalendar();
        this.oauth2Client = null;
        this.calendar = null;
    }

    isConnected() {
        const config = this.db.getGoogleCalendarConfig();
        return config && config.is_enabled && config.access_token;
    }
}

module.exports = GoogleCalendarService;
