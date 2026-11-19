---
title: "Le cockpit : une question par écran"
description: "Le cockpit de Krizaka Agents montre ce qui attend une personne et ce qui tourne vraiment, chaque chiffre avec sa date."
---

### § 1 — Une question par écran

Le cockpit est l'écran d'une personne qui dirige une entreprise d'agents. Chaque vue répond à une question qu'on se pose
dans la journée : qu'est-ce qui m'attend ? la machine va-t-elle bien ? qu'est-ce qui est cassé, et depuis quand ?

### § 2 — Ce qui m'attend

Le soir du 15 novembre, la phrase du haut disait « 38 choses vous attendent. Tout le reste avance sans vous. » Elle compte
ce qui attend une personne, pas ce que font les agents : ce qui limite l'entreprise, c'est la file des décisions que les
agents ne peuvent pas prendre. Quand rien n'attend, elle le dit.

### § 3 — Puis-je me fier à ce chiffre ?

Chaque chiffre porte sa date. Chaque source a sa cadence de collecte (15 minutes pour le tableau, 5 pour les équipes, une
heure pour les versions) ; un bloc devient « ancien » au-delà du double de sa cadence ; si la dernière collecte a échoué,
le badge dit « Échec » avec la date des données encore affichées. Le mot « ancien » se lit aussi en noir et blanc : la
couleur seule ne porte pas l'information.

### § 4 — La machine va-t-elle bien ?

La page répond d'abord par une phrase, oui ou non, puis six lignes dont le détail reste replié. Ce soir-là : 13 sessions
d'agents au travail, 16 alertes ouvertes, dont 2 graves. Le système se freine aussi quand la machine est surchargée : un
lancement a attendu pour cette raison.

### § 5 — Ce qu'il ne fait pas

Le cockpit lit la base d'exploitation et GitHub. Il ne peut lancer qu'une courte liste fixe de commandes locales, depuis
la machine seulement. Il n'écrit jamais sur GitHub.

[Le récit complet : un cockpit local pour diriger toute l'entreprise →](https://blog.krizaka.com/fr/story/one-local-cockpit-to-run-the-whole-company/)
