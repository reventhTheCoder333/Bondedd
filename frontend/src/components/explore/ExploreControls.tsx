import { ChangeEvent } from 'react'
import { secondaryButtonClass } from '../ui/buttonStyles'

const categories = ['social', 'career', 'tech', 'arts', 'wellness', 'sports', 'academic']

export default function ExploreControls({
  searchText,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  listVisible,
  onToggleList,
}: {
  searchText: string
  onSearchChange: (value: string) => void
  activeCategories: string[]
  onToggleCategory: (category: string) => void
  listVisible: boolean
  onToggleList: () => void
}) {
  return (
    <div className="rounded-[28px] border border-[rgba(177,128,37,0.14)] bg-[rgba(255,252,247,0.9)] p-4 shadow-[0_18px_60px_rgba(92,64,9,0.12)] backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-[22px] border border-[rgba(177,128,37,0.12)] bg-white/90 px-4 py-3 lg:min-w-[22rem]">
          <input
            type="text"
            value={searchText}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
            placeholder="Search events, clubs, or places across UTD"
            className="w-full bg-transparent font-body text-sm text-[#403421] outline-none placeholder:text-[#9C8D73]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const active = activeCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                className={`rounded-full px-4 py-2 font-body text-sm capitalize transition ${
                  active
                    ? 'bg-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.12)]'
                    : 'border border-[rgba(177,128,37,0.12)] bg-white/88 text-[#403421] hover:border-accent hover:text-accent'
                }`}
              >
                {category}
              </button>
            )
          })}

          <button
            type="button"
            onClick={onToggleList}
            className={`ml-auto ${secondaryButtonClass}`}
          >
            {listVisible ? 'Hide list' : 'Show list'}
          </button>
        </div>
      </div>
    </div>
  )
}
