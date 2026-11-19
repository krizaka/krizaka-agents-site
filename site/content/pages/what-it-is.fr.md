---
title: "Krizaka Agents : comment nous livrons avec des agents"
description: "Nous construisons nos produits avec des agents IA. Voici comment : une session par ticket, des contrôles qui refusent, une personne qui décide. Pas à vendre."
---

**En bref** — La façon dont nous construisons nos produits : des agents IA écrivent les changements, des contrôles les vérifient, une personne les accepte ou les refuse.

**Pour les ingénieurs** — Ce qui entoure Claude Code pour livrer : une session par ticket, des contrôles qui refusent, une pull request, une personne qui décide.

> **Nous construisons nos produits avec, chaque jour. Il n'est pas à vendre pour l'instant.**

*Statut : en développement · utilisé chaque jour en interne.*

Mesuré sur 48 heures en novembre : 92 pull requests fusionnées, 37 écartées, chacune avec sa raison. Deux exemples fusionnés que vous pouvez ouvrir : [PR 379 du blogue](https://github.com/krizaka/krizaka-blog/pull/379), [PR 378](https://github.com/krizaka/krizaka-blog/pull/378).

<!--write-->

### § 1 — Ce que c'est

Krizaka Agents, c'est ce que nous mettons autour des modèles d'IA pour que leur travail soit fiable. Chaque changement
part d'un ticket, passe par des contrôles qui peuvent le refuser, arrive en pull request (une proposition de changement
du code, relue avant d'être fusionnée) et est accepté ou refusé par une personne. Les sessions tournent dans Claude Code ; c'est Claude Code qui fournit la boucle d'agent, pas nous. Ce que nous construisons, c'est ce
qu'il y a autour : de quoi livrer chaque changement en pull request et le faire refuser s'il ne passe pas.

Tout sert un seul travail : livrer. Cela commence au ticket et finit à la fusion et à sa vérification.

### § 2 — Trois règles, dont tout le reste découle

1. **GitHub est la source.** Tout ce que nous gardons en local est une copie, pour montrer et avertir.
2. **Pas de modèle là où la réponse doit être certaine.** Le lanceur, les garde-fous, les trains et le veilleur sont du code ordinaire.
3. **Les agents ne se parlent pas.** Une session écrit ce qu'elle a à dire dans un endroit qui reste : un commit, une pull request, une ligne en base.

### § 3 — Qui décide

Une personne a toujours le dernier mot sur l'argent, les comptes, le juridique et tout ce qui ne peut pas se défaire.
Dans ces limites, un agent IA qui joue le rôle de responsable technique décide de ce qui est réversible, avec un plafond
de dépense écrit.
Les agents proposent chaque changement par pull request ; ils ne fusionnent pas.

### § 4 — Où nous en sommes

C'est notre propre technologie, celle avec laquelle nous construisons nos produits, à commencer par Sovkora, le service d'IA sur lequel tournent nos produits. Elle évolue chaque
semaine. Elle n'est ni en vente ni en libre-service, et son code reste privé. Ce site montre la méthode ; il n'y a rien à
acheter ni à demander ici.

### Ce qui n'est pas encore prouvé
- Le lien entre les chevauchements de travail et la reprise de travail, en temps ou en argent.
- Tout cela avec un autre agent que Claude Code.

[Le récit complet : l'architecture de Krizaka Agents →](https://blog.krizaka.com/fr/story/the-architecture-of-krizaka-agents/)
