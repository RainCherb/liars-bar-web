import type {
  CharacterDef,
  CharacterId,
  Personality,
} from "./types";

/**
 * Завсегдатаи бара. Характер задаёт стиль игры бота, реплики — характер
 * за столом. Персонажи Scubby…Kudo взяты из оригинала, Mitzi и Grim
 * дополняют состав до девяти.
 */
export const CHARACTERS: CharacterDef[] = [
  {
    id: "scubby",
    name: "Scubby",
    title: "тревожный кролик",
    kind: "rabbit",
    persona: { aggression: 0.32, honesty: 0.78, chaos: 0.25, bravado: 0.25 },
    lines: {
      play: ["Кладу, кладу…", "Только не смотри так."],
      bluff: ["Э-это точно то, что нужно.", "Всё честно, клянусь."],
      challenge: ["Я… я не верю!", "Врёшь ведь!"],
      caught: ["Ой. Ой-ой.", "Зачем я это сделал…"],
      survived: ["Живой! Я живой!", "Сердце в пятках."],
    },
  },
  {
    id: "foxy",
    name: "Foxy",
    title: "лиса-провокатор",
    kind: "fox",
    persona: { aggression: 0.58, honesty: 0.42, chaos: 0.5, bravado: 0.65 },
    lines: {
      play: ["Смотри внимательно.", "Как по учебнику."],
      bluff: ["Чистая правда, дорогуша.", "Разве я когда-то лгала?"],
      challenge: ["Попалась, мышка.", "Открывай, красавчик."],
      caught: ["Пф. Бывает.", "Один раз не считается."],
      survived: ["Мне идёт этот револьвер.", "Удача любит наглых."],
    },
  },
  {
    id: "bristle",
    name: "Bristle",
    title: "ворчливый вепрь",
    kind: "boar",
    persona: { aggression: 0.72, honesty: 0.6, chaos: 0.3, bravado: 0.6 },
    lines: {
      play: ["Держи.", "Хрр. Мой ход."],
      bluff: ["Не нравится — вскрывай.", "Всё как надо, хрр."],
      challenge: ["Брехня!", "Показывай, что положил!"],
      caught: ["Хрр… ладно.", "Достал ты меня."],
      survived: ["Меня так не убьёшь.", "Хрр! Дальше."],
    },
  },
  {
    id: "toar",
    name: "Toar",
    title: "угрюмый бык",
    kind: "bull",
    persona: { aggression: 0.44, honesty: 0.86, chaos: 0.15, bravado: 0.4 },
    lines: {
      play: ["Ход сделан.", "Молча."],
      bluff: ["Так надо.", "Не спрашивай."],
      challenge: ["Ложь.", "Вскрывай."],
      caught: ["Мгм.", "Заслужил."],
      survived: ["Ещё не сегодня.", "Дальше."],
    },
  },
  {
    id: "cupcake",
    name: "Cupcake",
    title: "милая свинья",
    kind: "pig",
    persona: { aggression: 0.3, honesty: 0.52, chaos: 0.62, bravado: 0.55 },
    lines: {
      play: ["Держите, зайчики!", "Такая хорошенькая карта."],
      bluff: ["Я бы не обманула, ну!", "Честно-пречестно!"],
      challenge: ["Ай-ай, врунишка!", "А вот и не верю."],
      caught: ["Ну какая же я глупая.", "Ой, попалась."],
      survived: ["Пусто! Как мило.", "Жива, милашки."],
    },
  },
  {
    id: "gerk",
    name: "Gerk",
    title: "крыса-калькулятор",
    kind: "rat",
    persona: { aggression: 0.62, honesty: 0.66, chaos: 0.18, bravado: 0.45 },
    lines: {
      play: ["По расчёту.", "Вероятность на моей стороне."],
      bluff: ["Статистика не против.", "Проверяемо. Но не советую."],
      challenge: ["Арифметика не сходится.", "Столько их не бывает."],
      caught: ["Погрешность модели.", "Учтено на будущее."],
      survived: ["Пять шестых. Ожидаемо.", "Расчёт верен."],
    },
  },
  {
    id: "kudo",
    name: "Kudo",
    title: "холодный волк",
    kind: "wolf",
    persona: { aggression: 0.5, honesty: 0.7, chaos: 0.32, bravado: 0.5 },
    lines: {
      play: ["Твой ход.", "Смотрю на тебя."],
      bluff: ["Проверь, если смелый.", "Уверен?"],
      challenge: ["Ты дрогнул.", "Открывай."],
      caught: ["Хм. Хорошо считаешь.", "Принято."],
      survived: ["Барабан помнит.", "Ещё дышу."],
    },
  },
  {
    id: "mitzi",
    name: "Mitzi",
    title: "певичка-кошка",
    kind: "cat",
    persona: { aggression: 0.48, honesty: 0.38, chaos: 0.58, bravado: 0.72 },
    lines: {
      play: ["Под мою песенку.", "Мур. Твой выход."],
      bluff: ["Я вся такая честная, мяу.", "Слово артистки."],
      challenge: ["Фальшивишь, милый.", "Не тот мотив. Вскрывай."],
      caught: ["Ах, разоблачена.", "Аплодисменты обманщице."],
      survived: ["Мур. Ещё куплет.", "Публика довольна."],
    },
  },
  {
    id: "grim",
    name: "Grim",
    title: "старый козёл-бармен",
    kind: "goat",
    persona: { aggression: 0.55, honesty: 0.74, chaos: 0.22, bravado: 0.38 },
    lines: {
      play: ["За счёт заведения.", "Кладу и наливаю."],
      bluff: ["Заведение не обманывает.", "Пей и не спорь."],
      challenge: ["Я тут всякое видал. Врёшь.", "Открывай, сынок."],
      caught: ["М-да. Старею.", "Запишу на свой счёт."],
      survived: ["Я тут всех переживу.", "Пусто. Как обычно."],
    },
  },
];

export const CHARACTER_BY_ID = new Map<CharacterId, CharacterDef>(
  CHARACTERS.map((c) => [c.id, c]),
);

export const ALL_CHARACTER_IDS: CharacterId[] = CHARACTERS.map((c) => c.id);

export const DEFAULT_PERSONA: Personality = {
  aggression: 0.5,
  honesty: 0.62,
  chaos: 0.35,
  bravado: 0.5,
};

/** Случайная реплика персонажа по поводу. */
export function botLine(
  characterId: CharacterId | null,
  kind: keyof CharacterDef["lines"],
  rng: () => number = Math.random,
): string | null {
  if (!characterId) return null;
  const def = CHARACTER_BY_ID.get(characterId);
  if (!def) return null;
  const pool = def.lines[kind];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
}
