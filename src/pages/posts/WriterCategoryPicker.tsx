import { SelectControl } from '../../shared/ui/SelectControl'

type Props = { label: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }

export function WriterCategoryPicker(props: Props) {
  return <SelectControl {...props} className="writer-category-picker" />
}
