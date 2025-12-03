import os
from authentik.core.models import User, Application
from django.contrib.auth.models import Group

try:
    from authentik.providers.oauth2.models import OAuth2Provider
except Exception:
    OAuth2Provider = None


def main():
    email = os.environ.get("AUTHENTIK_BOOTSTRAP_EMAIL")
    password = os.environ.get("AUTHENTIK_BOOTSTRAP_PASSWORD")
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    redirect_uris = os.environ.get(
        "TRAILHEAD_AUTH_REDIRECT_URIS",
        f"{frontend_url}/callback",
    )

    if not email:
        print("AUTHENTIK_BOOTSTRAP_EMAIL not set; aborting")
        return

    # Ensure admin user exists
    u, created = User.objects.get_or_create(
        username=email, defaults={"email": email, "is_active": True}
    )
    if created:
        u.set_password(password)
        u.save()
        print("User created.")
    else:
        print("User already exists.")

    # Ensure 'authentik Admins' group exists and add user
    g, group_created = Group.objects.get_or_create(name="authentik Admins")
    if g not in u.groups.all():
        u.groups.add(g)
        print("User added to 'authentik Admins' group.")
    else:
        print("User already in 'authentik Admins' group.")

    # Create or get the Application
    app, app_created = Application.objects.get_or_create(
        name="trailhead",
        defaults={
            "slug": "trailhead",
            "meta_launch_url": frontend_url,
            "meta_description": "Trailhead frontend application",
            "meta_icon": "fa-solid fa-mountain-sun",
            "meta_publisher": "Trailhead Bootstrap",
        },
    )
    if app_created:
        print("'trailhead' application created.")
    else:
        print("'trailhead' application already exists.")

    if OAuth2Provider is None:
        print(
            "OAuth2Provider model not available in this Authentik version; skipping provider creation."
        )
        return

    # Create or update OAuth2Provider defensively
    provider = None
    try:
        provider, prov_created = OAuth2Provider.objects.get_or_create(name="trailhead-oauth2")
        if prov_created:
            print("'trailhead-oauth2' provider created.")
        else:
            print("'trailhead-oauth2' provider already exists.")
        
        # Set authorization flow to default if not already set
        try:
            from authentik.flows.models import Flow
            if not provider.authorization_flow:
                # Try multiple common authorization flow slugs
                flow_slugs = [
                    "default-provider-authorization-implicit-consent",
                    "default-provider-authorization-explicit-consent",
                    "default-authorization-flow",
                ]
                default_flow = None
                for slug in flow_slugs:
                    default_flow = Flow.objects.filter(slug=slug).first()
                    if default_flow:
                        break
                
                # If no matching slug, try to find any authorization flow
                if not default_flow:
                    default_flow = Flow.objects.filter(designation="authorization").first()
                
                if default_flow:
                    provider.authorization_flow = default_flow
                    provider.save()
                    print(f"Set authorization flow to: {default_flow.slug}")
                else:
                    print("Warning: Could not find any authorization flow")
                    # List available flows for debugging
                    flows = Flow.objects.all()
                    if flows.exists():
                        print(f"Available flows: {', '.join([f.slug for f in flows])}")
                    else:
                        print("No flows found in database")
                    
                    # Create a simple authorization flow
                    print("Creating default authorization flow...")
                    try:
                        from authentik.flows.models import FlowDesignation
                        default_flow = Flow.objects.create(
                            name="Default Authorization Flow",
                            slug="default-provider-authorization-implicit-consent",
                            designation=FlowDesignation.AUTHORIZATION,
                            title="Authorize Application"
                        )
                        provider.authorization_flow = default_flow
                        provider.save()
                        print(f"Created and set authorization flow: {default_flow.slug}")
                    except Exception as create_err:
                        print(f"Error creating authorization flow: {create_err}")
        except Exception as e:
            print(f"Warning: Could not set authorization flow: {e}")
    except Exception as e:
        print(f"Could not get_or_create provider: {e}")
        try:
            provider = OAuth2Provider.objects.create(name="trailhead-oauth2")
            print("'trailhead-oauth2' provider created with minimal fields.")
        except Exception as e2:
            print(f"Failed to create OAuth2Provider: {e2}")
            provider = None

    if provider is None:
        print("No provider object available; skipping provider configuration.")
        return

    # Set redirect URIs using the raw JSONB field
    # Authentik 2024.x stores redirect_uris as JSONB with url and matching_mode
    try:
        import json
        from django.db import connection
        
        # Parse multiple redirect URIs if provided (newline or comma separated)
        uri_list = []
        for uri in redirect_uris.replace('\n', ',').split(','):
            uri = uri.strip()
            if uri:
                uri_list.append({"url": uri, "matching_mode": "strict"})
        
        redirect_uris_json = json.dumps(uri_list)
        
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE authentik_providers_oauth2_oauth2provider SET _redirect_uris = %s::jsonb WHERE provider_ptr_id = %s",
                [redirect_uris_json, provider.pk]
            )
        print(f"Set redirect_uris to: {redirect_uris_json}")
    except Exception as e:
        print(f"Warning: Could not set redirect_uris: {e}")

    # Associate provider with application using multiple possible fields/relations
    associated = False
    # Associate provider with application
    try:
        app.provider = provider
        app.save()
        associated = True
    except Exception as e:
        print(f"Error setting app.provider: {e}")
        associated = False

    try:
        provider.save()
    except Exception as e:
        print(f"Warning: saving provider raised: {e}")

    # Attach scope mappings to the provider
    # Authentik uses ScopeMapping objects linked via property_mappings (M2M relationship)
    try:
        from authentik.providers.oauth2.models import ScopeMapping
        
        # Get the default scope mappings we need
        required_scopes = ["openid", "email", "profile"]
        scope_mappings = []
        
        for scope_name in required_scopes:
            try:
                # Find the default scope mapping for this scope
                mapping = ScopeMapping.objects.filter(scope_name=scope_name).first()
                if not mapping:
                    # Create the scope mapping with proper expressions
                    scope_config = {
                        "openid": {
                            "expression": "return {}",
                            "description": "OpenID scope"
                        },
                        "email": {
                            "expression": 'return {\n    "email": request.user.email,\n    "email_verified": True\n}',
                            "description": "Email scope - returns user email address"
                        },
                        "profile": {
                            "expression": 'return {\n    "name": request.user.name,\n    "given_name": request.user.name,\n    "preferred_username": request.user.username,\n    "nickname": request.user.username\n}',
                            "description": "Profile scope - returns user profile information"
                        }
                    }
                    
                    config = scope_config.get(scope_name, {})
                    mapping = ScopeMapping.objects.create(
                        scope_name=scope_name,
                        name=scope_name,
                        description=config.get("description", f"Auto-created mapping for {scope_name}"),
                        expression=config.get("expression", "return {}")
                    )
                    print(f"Created scope mapping: {mapping.name} ({scope_name})")
                else:
                    print(f"Found scope mapping: {mapping.name} ({scope_name})")
                scope_mappings.append(mapping)
            except Exception as e:
                print(f"Warning: Error finding/creating scope mapping for '{scope_name}': {e}")
        
        if scope_mappings:
            # Attach the scope mappings to the provider
            try:
                provider.property_mappings.set(scope_mappings)
                provider.save()
                print(f"Successfully attached {len(scope_mappings)} scope mappings to provider")
                
                # Verify the mappings were attached
                attached_count = provider.property_mappings.count()
                print(f"Provider now has {attached_count} property mappings")
            except Exception as e:
                print(f"Warning: Could not attach scope mappings to provider: {e}")
        else:
            print("Warning: No scope mappings found. Provider may not work correctly.")
            print("Please configure scope mappings manually in the Authentik UI.")
    except ImportError:
        print("Warning: ScopeMapping model not available in this Authentik version.")
        print("Please configure scope mappings manually in the Authentik UI.")
    except Exception as e:
        print(f"Warning: Error while configuring scope mappings: {e}")

    if associated:
        print("Provider associated with application.")
    else:
        print("Could not associate provider with application; please link manually in UI.")

    # Print client id/secret if available
    try:
        print("Provider client_id:", provider.client_id)
        print("Provider client_secret:", provider.client_secret)
    except Exception:
        print("Provider client_id/secret not accessible on this Authentik version.")


if __name__ == "__main__":
    main()
