import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get('GOOGLE_CALLBACK_URL');

    console.log('🔧 Google Strategy Configuration:');
    console.log('   Client ID:', clientID ? '✅ Set' : '❌ Missing');
    console.log('   Client Secret:', clientSecret ? '✅ Set' : '❌ Missing');
    console.log('   Callback URL:', callbackURL);

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Missing required Google OAuth environment variables');
    }

    // ✅ FIXED: Removed invalid options (accessType and prompt)
    // These are not part of the passport-google-oauth20 strategy options
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('✅ Google profile received:', profile.emails[0]?.value);
      
      const { name, emails, photos, id } = profile;

      // Validate required fields
      if (!emails || emails.length === 0) {
        console.error('❌ No email found in Google profile');
        return done(new Error('No email found in Google profile'), null);
      }

      // ✅ Pass all necessary data including Google ID
      const user = {
        email: emails[0].value,
        name: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : 'User',
        picture: photos?.[0]?.value,
        googleId: id, // ✅ Google's unique user ID (sub)
        accessToken,
      };

      console.log('✅ User validated:', user.email);
      done(null, user);
    } catch (error) {
      console.error('❌ Error validating Google user:', error);
      done(error, null);
    }
  }
}