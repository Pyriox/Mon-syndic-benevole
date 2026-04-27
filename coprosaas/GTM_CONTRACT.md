# Contrat GTM / GA4

Ce document décrit le contrat minimal entre le code applicatif et le conteneur GTM. Toute modification du conteneur doit le respecter pour éviter les doubles comptages et la réintroduction de pages internes.

## Chargement

- Consent Mode v2 est initialisé avant GTM dans `src/app/layout.tsx`.
- GTM peut charger avant consentement explicite, mais le conteneur ne doit pas créer de tags GA4 autonomes qui contournent les événements poussés par l’application.
- Le `noscript` GTM reste désactivé pour éviter toute requête Google avant l’initialisation JavaScript du consentement.

## Pageviews SPA

- Les pages publiques sont envoyées via l’événement `virtual_pageview` poussé par `src/lib/gtag.ts`.
- Le tag GA4 de pageview SPA doit être déclenché uniquement sur `virtual_pageview`.
- Aucun tag GA4 ne doit utiliser les triggers GTM `Page View`, `DOM Ready`, `Window Loaded` ou `History Change` pour les pages applicatives.
- Le conteneur ne doit pas utiliser de trigger générique basé sur `{{Event}}` qui inclut `virtual_pageview` ou les événements `gtm.*`.

## Variables

- Pour `virtual_pageview`, utiliser les champs poussés par l’application (`page_location`, `page_title`, `consent_state`, `measurement_mode`).
- Ne pas recréer de variable `page_path` custom pour les vues SPA ; utiliser la variable GTM native `Page Path`.

## Événements métier autorisés

- Les événements web côté GA4 autorisés sont ceux gérés par `src/lib/gtag.ts` et `src/lib/ga4-admin.ts`.
- Les pages dashboard ne remontent pas via `page_view`, mais via `dashboard_page_view`.
- Les pages admin ne doivent jamais être remontées via événements custom.
- Quand le consentement analytics est refusé, seuls les événements anonymisés (`sign_up_anonymous`, `login_anonymous`, etc.) doivent être collectés.

## Vérifications à faire après modification GTM

- Une navigation publique pousse exactement un `virtual_pageview`.
- Une navigation dashboard ne pousse pas de `page_view` public, mais peut pousser `dashboard_page_view`.
- Une navigation admin ne pousse aucun événement de page custom.
- Les événements `sign_up`, `login`, `begin_checkout` et `purchase` ne sont pas dupliqués par un tag GTM générique.

## Google Ads

- ID Google Ads : `AW-18027963981` (tag de conversion chargé via GTM).
- Variables d'environnement nécessaires :
  - `NEXT_PUBLIC_GOOGLE_ADS_ID` = `AW-18027963981`
  - `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` = label de la conversion « Abonnement » (à récupérer dans Google Ads → Objectifs → Conversions)
- Conversions déclenchées côté client :
  - **Inscription** (`sign_up`) : déjà pushée dans `dataLayer` depuis `register/page.tsx` → GTM doit configurer un tag Ads sur l'événement `sign_up`.
  - **Abonnement** (`purchase`) : `SubscriptionSuccessTracker` appelle `trackAdsConversion(PURCHASE_LABEL, { value, currency: 'EUR' })` via `gtag('event', 'conversion', { send_to: 'AW-18027963981/LABEL' })` lorsque l'utilisateur atterrit sur `/abonnement?success=1`. Ne se déclenche que si `ad_storage` est accordé (Consent Mode v2). La conversion GA4 `purchase` reste envoyée côté serveur via Measurement Protocol et est indépendante.
- Configuration requise dans GTM :
  - Tag GA4 déclenché sur `sign_up` → conversion Ads « Inscription » (ou configurer directement une conversion Ads sur l'événement `sign_up` dans GTM).
  - Aucun tag Ads supplémentaire n'est nécessaire pour `purchase` : le code applicatif appelle directement `gtag('event', 'conversion', ...)` via `trackAdsConversion`.