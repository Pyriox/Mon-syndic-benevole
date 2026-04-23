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