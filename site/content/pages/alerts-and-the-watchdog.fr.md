---
title: "Alertes et veilleur : chaque alerte a un propriétaire"
description: "Un veilleur sans modèle lit la machine et GitHub ; chaque alerte reste dans une table jusqu'à ce qu'une personne la prenne et qu'une preuve la ferme."
---

### § 1 — Une alerte qui s'efface n'a jamais existé

Une alerte ne vaut que si elle reste jusqu'à ce qu'une personne s'en occupe. Le 9 novembre, une tâche planifiée s'est
arrêtée environ six heures et demie ; le veilleur l'a vue dix minutes plus tard, mais en fenêtre que personne n'a lue. Une notification apparaît et disparaît : il manquait un endroit
où l'alerte reste tant que personne ne s'en est occupé.

### § 2 — Une table, un propriétaire, une preuve

Depuis le 10 novembre, toute alerte est une ligne d'une seule table de notre base d'exploitation, et aucune notification
n'est plus envoyée. Une alerte est ouverte ; une personne (ou une session) la prend avec une note, qui l'a
regardée et ce qui a été compris ; elle est résolue avec une preuve. Prendre une alerte ne la ferme pas : le veilleur la
résout lui-même quand sa lecture complète suivante ne voit plus le problème, et garde cette lecture comme preuve. La base
refuse une résolution sans preuve. Une alerte ouverte n'est jamais purgée ; les autres le sont sept jours après leur
prise en compte.

<!--view:alert_life-->

### § 3 — Le veilleur lit, il ne répare pas

Le veilleur est du code, sans modèle, donc sans jeton. Toutes les 15 minutes, il lance ses contrôles locaux (tâches
planifiées qui échouent ou se taisent, sessions bloquées ou qui tournent en boucle). Au plus une fois par heure, il lit
GitHub : un main rouge, une pull request rouge sans responsable depuis une heure, un dépôt gelé. Il n'écrit jamais sur
GitHub.

### § 4 — La base ne décide jamais

Le matin du 11 novembre, 43 des 71 alertes ouvertes étaient périmées (pull requests déjà fusionnées, branches de
nouveau vertes). La base sert à ne rien rater, jamais à décider : avant de fusionner ou d'écrire « fait », on vérifie sur
GitHub.

### § 5 — Des événements plutôt que l'horloge

Le 10 novembre, nous avons relu les 20 dernières exécutions de chaque tâche planifiée : la plupart répondaient « rien à
faire ». Les tâches partent maintenant sur un événement (une fusion, la fin d'une session), pas sur l'horloge.

### Ce qui n'est pas encore prouvé
- L'historique des alertes n'est pas encore rejouable à partir des journaux ; il n'existe qu'en local.

[Le récit complet : comment nos équipes d'agents se parlent →](https://blog.krizaka.com/fr/story/how-our-agent-teams-talk/)
