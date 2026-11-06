# Configuration de Supabase pour FASO YIIR

Supabase fournit la base PostgreSQL, l’authentification et l’API utilisée par le site GitHub Pages. Aucune clé `service_role` ne doit être placée dans le site.

## 1. Créer le projet

1. Crée un projet sur [Supabase](https://supabase.com/dashboard) et garde son mot de passe de base en lieu sûr.
2. Dans **SQL Editor**, exécute le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Cela crée les annonces, les règles Row Level Security, le stockage des photos et les deux annonces de démonstration.
3. Dans **Project Settings → API**, copie l’URL du projet et la clé publique `anon`/`publishable`.
4. Renseigne ces deux valeurs dans [`supabase-config.js`](./supabase-config.js), dans `url` et `anonKey`. Cette clé publique est prévue pour le navigateur ; ne colle jamais la clé `service_role` dans ce fichier.
5. Publie ces changements sur la branche `main` pour déclencher GitHub Pages.

## 2. Régler les comptes

- Dans **Authentication → URL Configuration**, ajoute `https://augustesomda13-afk.github.io` aux URL autorisées et définis `https://augustesomda13-afk.github.io/FASO-YIIR/` comme URL de redirection du site.
- Les visiteurs doivent confirmer leur adresse e-mail si la confirmation est activée dans les réglages d’authentification.
- La création de compte est ouverte, mais la publication requiert une session confirmée.
- Pour donner les droits d’administrateur, ouvre **Authentication → Users**, sélectionne ton compte, puis définis dans ses **app metadata** : `{"role":"admin"}`. Ne mets pas ce rôle dans les métadonnées modifiables par l’utilisateur (`user_metadata`). Déconnecte-toi puis reconnecte-toi pour renouveler la session.
- Seul un compte portant ce rôle peut supprimer des annonces. La règle est appliquée par PostgreSQL, pas seulement par l’interface.

## Données et photos

Les annonces sont publiques en lecture. Les utilisateurs authentifiés peuvent ajouter une annonce ; seul l’administrateur peut la supprimer. Les photos téléversées vont dans le bucket public `property-images`, avec une limite de 5 Mo. Les règles de stockage limitent l’envoi au dossier de l’utilisateur connecté.

Si l’URL ou la clé publique n’est pas configurée, le site affiche les annonces de démonstration et désactive la publication. Les annonces ajoutées avant ce branchement dans le `localStorage` d’un navigateur ne sont pas migrées automatiquement.
