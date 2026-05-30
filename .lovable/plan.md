# Plan — Refonte Zugher en place de marché territoriale SaaS

Projet ambitieux : refonte complète front + back + DB + IA, livré **par phases successives** dans le même projet Lovable. On démarre par les fondations (architecture multi-tenant, design system, connexion MySQL) puis on déroule les 9 modules.

## Architecture cible

- **Front** : TanStack Start (React 19, SSR, Tailwind v4), design inspiré de `zugher.com/index.html`, entièrement themable par territoire (logo, couleurs, contenus, nom).
- **Back** : serveurs functions TanStack (Node), connexion directe à ta base MySQL existante via `mysql2`/Drizzle. Pas de migration de données — on tape dessus.
- **Multi-tenant** : résolution du territoire via **sous-domaine** (`lyon.zugher.com`, `paris.zugher.com`…). Chaque requête identifie le `tenant_id` au middleware → toutes les requêtes SQL sont scopées.
- **Admin SaaS** : back-office racine (`admin.zugher.com`) pour créer/configurer un nouveau territoire (branding, modules activés, contenu d'accueil).
- **IA** : Lovable AI Gateway (Gemini 3 Flash + GPT-5 selon usage), pas de clé à fournir.
- **Auth** : Lovable Cloud (email + Google) pour les comptes utilisateurs côté SaaS, en parallèle de MySQL pour les données métier.

## Les 9 modules à reconstruire

1. **Territoires** — vitrine + annuaire des territoires actifs
2. **Opportunités de projets** — catalogue d'opportunités locales
3. **Bilan de compétences** — questionnaire + restitution IA
4. **Étude de marché** — génération assistée par IA à partir d'un secteur/zone
5. **Business plan** — éditeur structuré + génération IA section par section
6. **Crowdfunding** — campagnes, contributions, paiements
7. **Emploi** — offres + candidatures + matching IA
8. **Business développement** — CRM léger + recommandations
9. **Appels d'offres** — veille + alertes + résumés IA

Chaque module = route(s) dédiée(s) + tables MySQL existantes + fonctions serveur + composants UI cohérents avec le design system.

## Couche IA proposée

- **Recherche sémantique** transversale (territoires, projets, AO)
- **Génération** : business plan, étude de marché, fiche projet, résumé d'AO
- **Matching** : profil ↔ offre d'emploi / opportunité / appel d'offres
- **Chatbot territoire** : assistant qui répond sur les contenus du territoire courant
- **Modération** : annonces, candidatures, descriptions

## Découpage en phases (à valider après le plan)

**Phase 0 — Fondations (livrable initial)**
- Setup design system depuis `index.html` du nouveau design
- Connexion MySQL + résolution multi-tenant par sous-domaine
- Layout public (header, footer, switch territoire) + page d'accueil personnalisable
- Auth utilisateur (Lovable Cloud)
- Squelette admin SaaS pour créer un territoire de démo

**Phase 1 — Modules vitrine** : Territoires, Opportunités, Appels d'offres, Emploi (lecture + recherche + IA résumé/matching)

**Phase 2 — Modules outils IA** : Bilan compétences, Étude de marché, Business plan (générateurs IA + sauvegarde)

**Phase 3 — Modules transactionnels** : Crowdfunding (paiements Stripe), Business développement (CRM)

**Phase 4 — Polish SaaS** : back-office tenant complet, onboarding self-service, facturation SaaS.

## Détails techniques

- **DB MySQL** : on garde le schéma existant ; on ajoutera au besoin une colonne `tenant_id` aux tables non scopées et des tables `tenants`, `tenant_config`, `tenant_modules`. Migrations gérées via fichiers SQL versionnés que tu appliques sur ton MySQL.
- **Driver** : `mysql2` + `drizzle-orm` pour typage et requêtes safe.
- **Secrets nécessaires** : `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (je te les demanderai via le formulaire sécurisé au moment de Phase 0).
- **Code legacy** : tu uploades le zip PHP+SQL ; je m'en sers comme référence fonctionnelle (pas exécuté).
- **Sous-domaines en preview** : pendant le dev sur Lovable on simulera le tenant via un sélecteur ou un param `?tenant=`, le vrai routage sous-domaine s'active une fois publié sur ton domaine.

## Ce dont j'ai besoin de toi pour démarrer Phase 0

1. Le **zip du code Zugher actuel** + un **dump SQL** (structure suffit) — uploadé dans le chat.
2. Le fichier **`index.html` du nouveau design** (zughet.com) à uploader aussi.
3. Les **credentials MySQL** (je te demanderai via le formulaire secrets au bon moment, pas avant).
4. Confirmation du **nom du territoire de démo** pour la phase 0 (ex: "Vallée de Démo").

Une fois le plan approuvé, je démarre Phase 0 et on enchaîne les phases dans des tours suivants.
