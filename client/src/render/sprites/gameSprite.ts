export interface GameSprite<T> {
  addSprite(data: T): void;
  updateSprite(data: T): void;
  deleteSprite(): void;
}
