# Alignement du conteneur GTM

Ce document traduit [GTM_CONTRACT.md](./GTM_CONTRACT.md) en configuration GTM concrète.

## Objectif

Le code applicatif pousse déjà les événements corrects dans `dataLayer`. Le conteneur GTM doit seulement les relayer vers GA4 sans :

- doubler les `page_view`
- réintroduire des pages internes ou admin
- perdre les événements anonymisés (`sign_up_anonymous`, `login_anonymous`)

## Pré-requis

- Un seul Google tag / GA4 Configuration tag pour la propriété de production.
- Le conteneur ne doit pas avoir de tag GA4 déclenché sur `Page View`, `DOM Ready`, `Window Loaded` ou `History Change` pour le site applicatif.
- Le conteneur ne doit pas avoir de tag générique basé sur `{{Event}}` sans allowlist stricte.

## Variables GTM à créer

Variables Data Layer :

- `dlv_event` -> `event`
- `dlv_page_location` -> `page_location`
- `dlv_page_title` -> `page_title`
- `dlv_measurement_mode` -> `measurement_mode`
- `dlv_consent_state` -> `consent_state`
- `dlv_platform_area` -> `platform_area`
- `dlv_platform_group` -> `platform_group`
- `dlv_platform_name` -> `platform_name`
- `dlv_platform_path` -> `platform_path`
- `dlv_platform_depth` -> `platform_depth`
- `dlv_platform_role` -> `platform_role`
- `dlv_plan_id` -> `plan_id`
- `dlv_role` -> `role`
- `dlv_method` -> `method`
- `dlv_form` -> `form`
- `dlv_error` -> `error`
- `dlv_location` -> `location`
- `dlv_article_slug` -> `article_slug`
- `dlv_article_title` -> `article_title`

## Triggers GTM à créer

### 1. Trigger pageview SPA

Nom recommandé : `CE - virtual_pageview`

- Type : `Custom Event`
- Event name : `virtual_pageview`
- This trigger fires on : `All Custom Events`

### 2. Trigger dashboard interne

Nom recommandé : `CE - dashboard_page_view`

- Type : `Custom Event`
- Event name : `dashboard_page_view`

### 3. Trigger événements métier publics

Nom recommandé : `CE - public_business_events`

- Type : `Custom Event`
- Use regex matching : `true`
- Event name :

```text
^(sign_up|sign_up_anonymous|login|login_anonymous|begin_checkout|purchase|view_article|click_cta|form_abandonment|registration_error|login_error|password_reset_requested|password_reset_error|onboarding_complete)$
```

Important :

- `virtual_pageview` ne doit pas être dans cette liste.
- `dashboard_page_view` doit rester séparé.
- Aucun trigger ne doit matcher `gtm.js`, `gtm.dom`, `gtm.load` ou `gtm.historyChange`.

## Tags GTM à créer ou corriger

### 1. Tag Google tag / GA4 de base

Nom recommandé : `GA4 - Base`

- Type : `Google tag` ou `GA4 Configuration`
- Measurement ID : propriété de prod
- Trigger : `Initialization - All Pages` ou équivalent minimal GTM
- Ne pas activer de pageview automatique complémentaire côté GTM si une option de SPA auto pageview existe

But : charger GA4, pas recréer les événements applicatifs.

### 2. Tag pageview SPA public

Nom recommandé : `GA4 - virtual_pageview`

- Type : `GA4 Event`
- Event name : `page_view`
- Trigger : `CE - virtual_pageview`

Paramètres d’événement à passer :

- `page_location` = `{{dlv_page_location}}`
- `page_title` = `{{dlv_page_title}}`
- `measurement_mode` = `{{dlv_measurement_mode}}`
- `consent_state` = `{{dlv_consent_state}}`

Ne pas ajouter de `page_path` custom. Utiliser au besoin la variable native GTM `Page Path`.

### 3. Tag pages dashboard internes

Nom recommandé : `GA4 - dashboard_page_view`

- Type : `GA4 Event`
- Event name : `dashboard_page_view`
- Trigger : `CE - dashboard_page_view`

Paramètres d’événement :

- `platform_area` = `{{dlv_platform_area}}`
- `platform_group` = `{{dlv_platform_group}}`
- `platform_name` = `{{dlv_platform_name}}`
- `platform_path` = `{{dlv_platform_path}}`
- `platform_depth` = `{{dlv_platform_depth}}`
- `platform_role` = `{{dlv_platform_role}}`
- `measurement_mode` = `{{dlv_measurement_mode}}`
- `consent_state` = `{{dlv_consent_state}}`

### 4. Tag événements métier publics

Nom recommandé : `GA4 - public_business_events`

- Type : `GA4 Event`
- Event name : `{{Event}}`
- Trigger : `CE - public_business_events`

Paramètres d’événement à exposer si présents :

- `role` = `{{dlv_role}}`
- `method` = `{{dlv_method}}`
- `plan_id` = `{{dlv_plan_id}}`
- `form` = `{{dlv_form}}`
- `error` = `{{dlv_error}}`
- `location` = `{{dlv_location}}`
- `article_slug` = `{{dlv_article_slug}}`
- `article_title` = `{{dlv_article_title}}`
- `measurement_mode` = `{{dlv_measurement_mode}}`
- `consent_state` = `{{dlv_consent_state}}`

## Tags / triggers à supprimer ou désactiver si présents

- Tout tag GA4 déclenché sur `All Pages`
- Tout tag GA4 déclenché sur `History Change`
- Tout tag GA4 Event dont le trigger est un custom event trop large du type `.*`
- Tout tag qui envoie `admin_page_view`
- Toute logique conteneur qui recrée `page_path` depuis une variable Data Layer maison pour `virtual_pageview`

## Pourquoi l’inscription de ce matin peut manquer dans GA4

Dans le code, l’inscription standard n’envoie pas toujours `sign_up`.

Règle réelle :

- consentement analytics accordé -> `sign_up`
- consentement analytics refusé ou non accordé -> `sign_up_anonymous`

Référence code :

- [src/app/(auth)/register/page.tsx](./src/app/(auth)/register/page.tsx)
- [src/lib/gtag.ts](./src/lib/gtag.ts)

Donc si l’utilisateur de ce matin n’a pas accepté les cookies analytics, l’événement envoyé était très probablement `sign_up_anonymous`.

Si ton conteneur GTM ne relaie aujourd’hui que `sign_up` mais pas `sign_up_anonymous`, l’inscription n’apparaîtra pas dans GA4, même si le code applicatif a bien poussé un événement dans `dataLayer`.

## Vérification immédiate en Preview GTM

Sur `/register` :

1. Ouvre GTM Preview.
2. Crée un compte de test avec cookies analytics refusés.
3. Vérifie que l’événement `sign_up_anonymous` apparaît dans la timeline Preview.
4. Vérifie qu’un tag GA4 se déclenche bien sur cet événement.
5. Recommence avec cookies analytics acceptés et vérifie `sign_up`.
6. Vérifie qu’aucun `page_view` parasite n’est déclenché sur `gtm.js` ou `History Change`.

## Lecture attendue côté admin analytics

Une fois GTM aligné :

- `GA4 Inscriptions` sur `/admin/analytics` doit refléter `sign_up + sign_up_anonymous`
- `Inscriptions internes` doit rester la source applicative (`user_events.user_registered`)
- un écart durable entre les deux devient alors un vrai signal de tracking ou de traitement GA4, pas un défaut de mapping GTM