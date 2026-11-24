---
title: "Krizaka Agents 1.0 : migration des variables d’environnement (brouillon)"
description: "Brouillon non publié listant chaque alias ancien vers nouveau de Krizaka Agents 1.0, vérifié face au contrat."
---

**Avis de brouillon** — Cette référence accompagne le [brouillon d’architecture 1.0](/fr/v1/). Elle n’est pas publiée et documente une transition interne de nommage ; il n’y a rien à acheter ni à demander ici.

### § 1 — Préfixes de rôle et neutralité des fournisseurs

Les variables portent le nom du rôle tenu par un sous-système plutôt qu’un préfixe d’organisation ou le nom d’un fournisseur derrière un adaptateur. Durant la version de transition, chaque ancien nom passe par la table unique d’alias avec un avertissement nommant le nouveau ; ensuite, les anciens noms sont refusés au démarrage.

### § 2 — Table complète des alias

Chaque ligne ci-dessous est extraite directement de la copie du contrat d’environnement et triée par ordre alphabétique sur l’ancien nom.

<!--migration-aliases-->

### § 3 — Vérification face au contrat

Un test automatisé compare la table structurée du site clé par clé avec le contrat d’environnement source afin qu’aucun alias ne diverge ou ne soit omis à la main.
