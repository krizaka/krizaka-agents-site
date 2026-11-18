---
title: "Krizaka Agents : comment nous livrons avec des agents"
description: "Nous construisons nos produits avec des agents IA. Voici comment : une session par ticket, des contrôles qui refusent, une personne qui décide. Pas à vendre."
---

**Pour les pairs** — Ce qui entoure Claude Code pour livrer : une session par ticket, des contrôles qui refusent, une pull request, une personne qui décide.

**Pour tout le monde** — La façon dont nous construisons nos produits : des agents IA écrivent les changements, des contrôles les vérifient, une personne les accepte ou les refuse.

> **Nous construisons nos produits avec, chaque jour. Il n'est pas à vendre pour l'instant.**

*Statut : en développement · usage interne. Fonctionne avec Claude Code.*

### § 1 — Ce que c'est

Krizaka Agents est l'outillage qui entoure les modèles : un lanceur qui démarre chaque session de la même façon, des
garde-fous qui refusent, des trains qui fusionnent, un veilleur qui lit, un cockpit qui montre. Les sessions
tournent dans Claude Code ; c'est Claude Code qui fournit la boucle d'agent, pas nous. Ce que nous construisons, c'est ce
qu'il y a autour : de quoi livrer chaque changement en pull request et le faire refuser s'il ne passe pas.

Tout sert un seul travail : livrer. Cela commence au ticket et finit à la fusion et à sa vérification.

### § 2 — Trois règles, dont tout le reste découle

1. **GitHub est la source.** Tout ce que nous gardons en local est une copie, pour montrer et avertir.
2. **Pas de modèle là où la réponse doit être certaine.** Le lanceur, les garde-fous, les trains et le veilleur sont du code ordinaire.
3. **Les agents ne se parlent pas.** Une session écrit ce qu'elle a à dire dans un endroit qui reste : un commit, une pull request, une ligne en base.

### § 3 — Qui décide

Une personne fixe la direction et décide de ce qui est à elle : l'argent, les comptes, le juridique, ce qui ne peut pas
se défaire. Un agent CTO décide du reste tant que c'est réversible, avec un plafond écrit dès qu'une dépense est possible.
Les agents proposent chaque changement par pull request ; ils ne fusionnent pas.

### § 4 — Où nous en sommes

C'est notre propre technologie, celle avec laquelle nous construisons nos produits, Sovkora en tête. Elle évolue chaque
semaine. Elle n'est ni en vente ni en libre-service, et son code reste privé. Ce site montre la méthode ; il n'y a rien à
acheter ni à demander ici.

### Ce qui n'est pas encore prouvé
- Le lien entre les chevauchements de travail et la reprise de travail, en temps ou en argent.
- Tout cela avec un autre agent que Claude Code.

[Le récit complet : l'architecture de Krizaka Agents →](https://blog.krizaka.com/fr/story/the-architecture-of-krizaka-agents/)
