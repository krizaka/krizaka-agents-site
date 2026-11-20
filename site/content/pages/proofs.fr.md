---
title: "Preuves : ce que vous pouvez vérifier vous-même"
description: "Les chapitres publics et les pull requests fusionnées qui montrent Krizaka Agents au travail, avec leurs chiffres et leurs limites."
---

### § 1 — Ce que nous pouvons montrer

Le code de Krizaka Agents est privé. Cette page ne liste donc que ce que n'importe qui peut ouvrir : des chapitres du blog,
avec leurs mesures datées et leurs limites, et des pull requests fusionnées de dépôts publics. Une preuve que nous ne
pouvons pas montrer n'est pas citée ici.

### § 2 — Les chapitres

Les mesures déjà citées sur ce site : 190 000 → 40 000 jetons au premier tour d'une session · 92 PR fusionnées et 37
écartées en 48 h · 18 sessions sur 18 terminées.


| Sujet | Chapitre | Ce qu'on y trouve |
| :--- | :--- | :--- |
| Architecture | [L'architecture de notre outillage d'agents IA](https://blog.krizaka.com/fr/story/the-architecture-of-krizaka-agents/) | cinq vues vérifiées, les plafonds par session, deux audits en lecture seule (332 lancements, 0 dérive d'environnement) |
| Règles qui disent non | [Travailler avec des agents](https://blog.krizaka.com/fr/story/working-with-agents-rules-that-refuse/) | des refus réels, avec leur code de sortie |
| Coordinateur | [Des agents sous un coordinateur](https://blog.krizaka.com/fr/story/agents-under-a-coordinator/) | trois tests ratés, puis une vague qui passe ; ce qui n'est pas prouvé |
| Démarrage | [Chaque agent démarre dans le même monde](https://blog.krizaka.com/fr/story/every-agent-starts-in-the-same-world/) | 190 000 → 40 000 jetons au premier tour ; 18 sessions sur 18 terminées |
| Équipes | [Comment nos équipes d'agents se parlent](https://blog.krizaka.com/fr/story/how-our-agent-teams-talk/) | quatre audits le même jour : 14, 8, 10 puis 7 bugs |
| Fondateur et CTO | [Comment le CTO agent et moi travaillons](https://blog.krizaka.com/fr/story/how-the-founder-and-the-cto-agent-work/) | qui décide quoi |
| Trains | [Tchou-tchou : nos pull requests prennent le train](https://blog.krizaka.com/fr/story/tchou-tchou-how-our-pull-requests-catch-the-train/) | la file de pull requests |
| Cockpit | [Un cockpit local](https://blog.krizaka.com/fr/story/one-local-cockpit-to-run-the-whole-company/) | l'écran, chiffres du 15 novembre |

### § 3 — Une exécution réelle : deux équipes, les mêmes fichiers

Le 19 novembre 2026, deux équipes d’agents ont travaillé en même temps sur les mêmes cinq fichiers de Verikora. La console
ci-dessous rejoue le journal de cette exécution réelle, ligne par ligne, tel que l’outil l’a écrit. Chaque pull request
nommée est publique.

<!--run:overlap_log-->

**S1, réussi.** À 16:44, la porte a vu les cinq fichiers partagés, avant que la seconde pull request existe. Le train a
fait atterrir [#890](https://github.com/krizaka/verikora/pull/890) à 17:31 puis [#889](https://github.com/krizaka/verikora/pull/889) à 17:52 : aucun conflit, aucune poussée de reprise sur l’une comme sur l’autre.

**S2, échoué, gardé dans l’historique.** [#891](https://github.com/krizaka/verikora/pull/891) était empilée sur [#889](https://github.com/krizaka/verikora/pull/889) ; sa base a bougé après l’empilement, le
train a refusé de la rejouer à 17:54 et une personne a dû fusionner à la main à 18:04. Nous nous sommes arrêtés là et avons
corrigé la cause. Les chiffres :

<!--run:overlap_cases-->

**S2, reprise : réussie.** La reprise a refait le même cas sur deux nouveaux tickets ([#893](https://github.com/krizaka/verikora/pull/893), puis [#894](https://github.com/krizaka/verikora/pull/894) empilée dessus). Le train a rejoué lui-même la PR empilée et l’a fusionnée, sans aucune poussée manuelle. Notre outil de preuve a d’abord dit « échec » jusqu’à ce que sa règle apprenne à distinguer le rejeu du train d’une poussée manuelle ; les chiffres bruts sont gardés tels quels.

<!--run:overlap_s2_cases-->

Une exécution prouve un mécanisme sur un cas, pas un taux.

### § 4 — Des pull requests fusionnées, publiques

Des agents de Krizaka ouvrent des pull requests sur les dépôts publics de l'organisation, et les trains les fusionnent.
Deux exemples du 16 novembre, ouverts par l'application d'agents : [la PR n° 379 du blog](https://github.com/krizaka/krizaka-blog/pull/379)
(un chapitre) et [la PR n° 378](https://github.com/krizaka/krizaka-blog/pull/378) (la mise à jour des épingles de workflows).
Chaque dépôt public montre l'historique de ses pull requests fusionnées ; c'est la preuve qu'on peut parcourir soi-même.

### § 5 — Ce que cette page ne prouve pas

Les deux audits de 48 heures et les comptes de pull requests de toute l'organisation s'appuient sur des journaux et des
tickets privés : nous les citons dans les chapitres, mais vous ne pouvez pas les rejouer. Nous les rendrons vérifiables ou
nous les retirerons.
