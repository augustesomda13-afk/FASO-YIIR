# Configuration de Supabase pour FASO YIIR

Supabase fournit la base PostgreSQL, l’authentification et l’API utilisée par le site GitHub Pages. Aucune clé `service_role` ne doit être placée dans le site.

## 1. Créer le projet

1. Crée un projet sur [Supabase](https://supabase.com/dashboard) et garde son mot de passe de base en lieu sûr.
2. Dans **SQL Editor**, exécute le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Cela crée la table des annonces, les règles Row Level Security et le stockage des photos. Le schéma n’insère pas d’annonces fictives.
3. Dans **Project Settings → API**, copie l’URL du projet et la clé publique `anon`/`publishable`.
4. Renseigne ces deux valeurs dans [`supabase-config.js`](./supabase-config.js), dans `url` et `anonKey`. Cette clé publique est prévue pour le navigateur ; ne colle jamais la clé `service_role` dans ce fichier.
5. Si le projet contient encore les deux annonces de démonstration, exécute une seule fois [`supabase/remove-demo-properties.sql`](./supabase/remove-demo-properties.sql). Vérifie les lignes retournées : elles doivent correspondre aux deux annonces d’exemple.
6. Publie ces changements sur la branche `main` pour déclencher GitHub Pages.

## 2. Régler les comptes

- Dans **Authentication → URL Configuration**, ajoute `https://augustesomda13-afk.github.io` aux URL autorisées et définis `https://augustesomda13-afk.github.io/FASO-YIIR/` comme URL de redirection du site.
- Les visiteurs doivent confirmer leur adresse e-mail si la confirmation est activée dans les réglages d’authentification.
- La création de compte est ouverte, mais la publication requiert une session confirmée.
- Chaque utilisateur connecté peut modifier et supprimer ses propres annonces depuis la section **Mes annonces**. Un compte administrateur portant le rôle `admin` dans ses **app metadata** peut supprimer toutes les annonces. Ne mets pas ce rôle dans les métadonnées modifiables par l’utilisateur (`user_metadata`).
- Pour appliquer les nouvelles règles à un projet déjà configuré, exécute à nouveau `supabase/schema.sql` dans le SQL Editor Supabase. Les politiques sont recréées sans supprimer les annonces.

## Données et photos

Les annonces sont publiques en lecture. Les utilisateurs authentifiés peuvent ajouter, modifier et supprimer uniquement leurs propres annonces ; les administrateurs peuvent supprimer toutes les annonces. Les photos téléversées vont dans le bucket public `property-images`, avec une limite de 5 Mo. Les utilisateurs peuvent supprimer leurs propres photos ; les administrateurs peuvent supprimer toutes les photos.

Les visiteurs contactent directement l’hôte par WhatsApp ou téléphone pour vérifier le logement et convenir du paiement. Le site ne traite aucun paiement, ne réserve pas de logement et n’envoie pas de code Mobile Money. Vérifie les coordonnées et l’autorisation de publication avant d’approuver une annonce. Les mises en avant payantes ne sont pas activées tant qu’un canal de contact et un processus de paiement manuel ne sont pas définis.

Si l’URL ou la clé publique n’est pas configurée, le site désactive le catalogue et la publication : aucune annonce d’exemple n’est affichée. Les annonces ajoutées avant le branchement Supabase dans le `localStorage` d’un navigateur ne sont pas migrées automatiquement.
