export type ColumnPlacement = 'left' | 'right';

export type ColumnPartitionable = {
  column?: ColumnPlacement;
};

export function partitionByColumn<T extends ColumnPartitionable>(items: T[]) {
  const hasExplicit = items.some(
    (item) => item.column === 'left' || item.column === 'right',
  );

  if (!hasExplicit) {
    const splitIndex = Math.ceil(items.length / 2);
    return {
      left: items.slice(0, splitIndex),
      right: items.slice(splitIndex),
    };
  }

  return {
    left: items.filter((item) => item.column !== 'right'),
    right: items.filter((item) => item.column === 'right'),
  };
}
