import type { Award, Project, Publication } from "../content/schemas"

export type RelatedAchievement =
  | { readonly kind: "award"; readonly record: Award }
  | { readonly kind: "publication"; readonly record: Publication }

export function resolveRelatedAchievements(
  project: Project,
  awards: readonly Award[],
  publications: readonly Publication[],
): readonly RelatedAchievement[] {
  const awardsById = new Map(awards.map((award) => [award.id, award]))
  const publicationsById = new Map(publications.map((publication) => [publication.id, publication]))

  return project.related_achievements.map((achievement) => {
    if (achievement.kind === "award") {
      const record = awardsById.get(achievement.id)
      if (record === undefined) throw new Error(`Missing related award: ${achievement.id}`)
      return { kind: achievement.kind, record }
    }
    const record = publicationsById.get(achievement.id)
    if (record === undefined) throw new Error(`Missing related publication: ${achievement.id}`)
    return { kind: achievement.kind, record }
  })
}
