'use client'

import { Check } from 'lucide-react'
import type { ContentStrategyResult, StrategyTopicItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type PersonaGroup = {
  personaTitle: string
  topics: StrategyTopicItem[]
}

function groupTopicsByPersona(topics: StrategyTopicItem[]): PersonaGroup[] {
  const personaMap = new Map<string, StrategyTopicItem[]>()

  for (const topic of topics) {
    if (!personaMap.has(topic.personaTitle)) {
      personaMap.set(topic.personaTitle, [])
    }
    personaMap.get(topic.personaTitle)!.push(topic)
  }

  return [...personaMap.entries()].map(([personaTitle, items]) => ({
    personaTitle,
    topics: items,
  }))
}

export function StrategyResults({
  strategy,
  selectedTopicId,
  onSelectTopic,
}: {
  strategy: ContentStrategyResult
  selectedTopicId?: string
  onSelectTopic: (item: StrategyTopicItem) => void
}) {
  const groups = groupTopicsByPersona(strategy.topics)

  return (
    <section>
      <div className="mb-6">
        <h3 className="font-heading text-lg text-foreground">选题</h3>
        <p className="text-sm text-muted-foreground mt-1">
          共 {strategy.topics.length} 个选题，请选择 1 个用于下一步脚本生成
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((persona) => (
          <PersonaSection
            key={persona.personaTitle}
            persona={persona}
            selectedTopicId={selectedTopicId}
            onSelectTopic={onSelectTopic}
          />
        ))}
      </div>
    </section>
  )
}

function PersonaSection({
  persona,
  selectedTopicId,
  onSelectTopic,
}: {
  persona: PersonaGroup
  selectedTopicId?: string
  onSelectTopic: (item: StrategyTopicItem) => void
}) {
  return (
    <div>
      <h4 className="font-heading text-lg text-foreground mb-4 pb-3 border-b border-border/60">
        {persona.personaTitle}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {persona.topics.map((item) => (
          <TopicCard
            key={item.id}
            item={item}
            isSelected={selectedTopicId === item.id}
            onSelect={() => onSelectTopic(item)}
          />
        ))}
      </div>
    </div>
  )
}

function TopicCard({
  item,
  isSelected,
  onSelect,
}: {
  item: StrategyTopicItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col text-left rounded-xl border bg-card p-3.5 transition-all duration-200 h-full',
        'hover:border-foreground/25',
        isSelected ? 'border-foreground ring-1 ring-foreground/15' : 'border-border/80'
      )}
    >
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-foreground border-foreground text-background'
              : 'border-border bg-background'
          )}
        >
          {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-1.5 pr-5">
        <p className="text-base text-foreground line-clamp-1 min-w-0">
          {item.contentMapTitle}
        </p>
        <span className="inline-flex shrink-0 items-center rounded-sm bg-card px-2 py-0.5 text-xs font-bold text-black">
          {item.packagingType}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground line-clamp-5">{item.topic}</p>
    </button>
  )
}
