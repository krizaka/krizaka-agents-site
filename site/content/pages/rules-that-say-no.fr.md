---
title: "Des garde-fous qui refusent, pour agents de code"
description: "Une règle écrite se perd, une commande qui refuse reste : comment Krizaka Agents arrête une erreur avant le push."
---

### § 1 — Une règle écrite s'oublie, une commande qui refuse ne s'oublie pas

Nos règles ont d'abord vécu dans un long texte que chaque session lisait au départ. Un peu plus loin, elle l'oubliait.
Alors nous les avons mises là où le travail doit passer : dans les commandes. Une commande refuse un titre mal formé, une
pull request sans ticket, ou un dépôt qui a déjà cinq pull requests ouvertes. Son message dit quoi faire ensuite : l'agent
n'a pas à retenir la règle, la commande s'en charge.

### § 2 — Quatre endroits où l'on refuse

*Fig. 1 — Avant et après chaque appel d'outil ; au commit et au push ; la pré-vérification avant le push ; la CI.*

- **À chaque appel d'outil** : un hook refuse (un fichier de secrets affiché, une écriture GitHub sans l'identité d'une application, du code lu avant l'index) ; le fichier édité est formaté et vérifié seul, en quelques secondes.
- **Au commit et au push** : secrets et identité de l'auteur ; au push, le format et les vérificateurs de workflows.
- **La pré-vérification, avant le push** : la boucle rapide du dépôt sur ce qui a changé (lint, types, tests des paquets touchés).
- **En CI** : les contrôles requis du dépôt, plus deux sur la méthode : un `fix` doit changer un garde-fou, et les cliquets.

Un garde-fou refuse et dit pourquoi ; il ne répare pas en silence, car une réparation silencieuse cache la cause.

### § 3 — Décaler à gauche, et les cliquets

Ce qu'on peut voir sur la machine n'attend pas la CI : sur 4 pull requests rouges en CI, 3 avaient échoué sur un contrôle
qui existait en local et n'avait pas tourné. Un **cliquet** compte une dette (avertissements de lint, code dupliqué,
exceptions aux règles d'architecture) dans un fichier que la CI laisse descendre, jamais monter. *Fig. 2.*

### § 4 — Chaque dérive laisse un garde-fou

Un bug veut dire qu'un garde-fou manquait. Un jour, des sessions démarraient jusqu'à quatre fois le même train : un second
train pour une pull request qui en a déjà un refuse maintenant de partir. Chaque refus d'une porte est écrit dans un
seul journal ; une règle reste quand son compte montre un effet.

### § 5 — Un garde-fou peut exister et ne rien voir

Le garde-fou « l'index du code d'abord » existait depuis des jours ; sur 101 sessions, 86 n'avaient jamais interrogé
l'index : il ne regardait que le début de la commande. Nous l'avons dit dans le chapitre, et nous le redisons ici.

### § 6 — Ce qui reste à une personne

La direction, l'argent, les comptes, le juridique et tout ce qui ne peut pas se défaire. Devant l'un d'eux, une session ne
devine pas : elle déplace la carte en « Bloqué » avec une phrase.

[Le récit complet : travailler avec des agents, des règles qui disent non →](https://blog.krizaka.com/fr/story/working-with-agents-rules-that-refuse/)
