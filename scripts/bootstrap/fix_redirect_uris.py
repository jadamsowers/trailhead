#!/usr/bin/env python3
"""Fix Authentik OAuth2 provider redirect URIs"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "authentik.root.settings")
django.setup()

from authentik.providers.oauth2.models import OAuth2Provider

def main():
    try:
        provider = OAuth2Provider.objects.get(name="trailhead-oauth2")
        print(f"Current redirect_uris: {provider.redirect_uris}")
        
        # Set redirect URIs - the field expects a string with newline-separated URIs
        redirect_uris = "http://localhost:3000/callback"
        provider.redirect_uris = redirect_uris
        provider.save()
        
        # Verify
        provider.refresh_from_db()
        print(f"Updated redirect_uris: {provider.redirect_uris}")
        print(f"Client ID: {provider.client_id}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
