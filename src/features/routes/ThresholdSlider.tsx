import { Group, Slider, Text } from "@mantine/core";

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const ThresholdSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
}: ThresholdSliderProps) => {
  return (
    <div>
      <Text size="sm" fw={600} mb="sm">Include bins from fill level</Text>
      <Group gap="md" wrap="nowrap"><Slider flex={1} min={min} max={max} value={value} onChange={onChange} label={(v) => `${v}%`} /><Text fw={700} c="forest.7" w={48}>{value}%</Text></Group>
    </div>
  );
};
