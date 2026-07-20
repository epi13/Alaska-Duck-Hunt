# Species Data

Species content is a structured field-guide database, not an encoded hunting regulation. The production dataset must include every bird that authoritative sources show may legally be hunted somewhere in Alaska under some applicable framework, including relevant migratory waterfowl and state upland game birds. Inclusion never implies that hunting is lawful in every place, season, residency class, or circumstance.

## Record shape

Each species record includes:

- stable ID, common name, scientific name, and category;
- original pixel illustration and sprite atlas references;
- key identification traits and important sex, age, and seasonal-plumage differences;
- habitat, typical flight, broad Alaska distribution, and field-guide location tags;
- similar species and protected lookalikes;
- conservation and identification cautions;
- broad hunting-status context without fixed season dates or bag limits;
- citations with title, publisher, URL, access date, and `lastVerified` date;
- the standard current-regulations reminder.

Status is modeled as context tags such as `state-game-bird`, `migratory-framework`, `subsistence-context`, `permit-may-apply`, `regional-closure-risk`, and `protected-lookalike-risk`. It is never a Boolean `legalToHunt` field.

## Visual variants

Variants describe male, female, juvenile, breeding, non-breeding, eclipse, or seasonal plumage only where meaningful. Gameplay sprites preserve identification anchors: wing patches, head and bill silhouette, tail shape, body proportion, contrast pattern, and flock silhouette. A record may be present in the guide while excluded from gameplay until its visual variants meet review criteria.

## Selection rules

A habitat supplies an explicit eligible pool. A round then filters by mode objective, discovery level, difficulty, requested species, and lookalike policy. Protected species can only enter the non-target/lookalike channel and can never produce a valid-hit outcome. Tests must prove that protected records are excluded from target pools.

## Editorial verification

Species taxonomy and identification may be sourced from authoritative conservation resources. Hunting-status context must be checked against current Alaska and federal publications before a release. Annual changes update citations and `lastVerified`, not the simulation's fictional limits. Ambiguous or conflicting status defaults to exclusion from target pools pending review.

> This game is educational entertainment, not legal advice. Always consult current Alaska, federal, land-manager, permit, emergency-order, and local rules before hunting.

