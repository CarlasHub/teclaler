/** Pinned OpenMoji 17 pictograms; custom SVGs are marked with an empty code. */
export const wordIllustrations: Record<string, { code: string; alt: string }> =
  {
    mesa: { code: "", alt: "Uma mesa com quatro pernas." },
    lata: { code: "1F96B", alt: "Uma lata de comida." },
    mapa: { code: "1F5FA", alt: "Um mapa dobrado." },
    mimo: { code: "1F381", alt: "Um pequeno presente com laço." },
    vela: { code: "1F56F", alt: "Uma vela acesa." },
    nave: { code: "1F680", alt: "Uma nave espacial a descolar." },
    foca: { code: "1F9AD", alt: "Uma foca." },
    gato: { code: "1F408", alt: "Um gato." },
    dado: { code: "1F3B2", alt: "Um dado de jogar." },
    fada: { code: "1F9DA", alt: "Uma fada com asas." },
    copo: { code: "1F95B", alt: "Um copo com leite." },
    bota: { code: "1F462", alt: "Uma bota." },
    nota: { code: "1F3B5", alt: "Uma nota musical." },
    rato: { code: "1F400", alt: "Um rato." },
    rosa: { code: "1F339", alt: "Uma rosa vermelha." },
    pata: { code: "1F986", alt: "Uma pata, a fêmea do pato." },
    sala: { code: "1F6CB", alt: "Um sofá numa sala." },
    tela: { code: "1F5BC", alt: "Uma tela com uma imagem." },
    mula: { code: "1FACF", alt: "Uma mula de orelhas compridas." },
    lobo: { code: "1F43A", alt: "Um lobo." },
    cama: { code: "1F6CF", alt: "Uma cama." },
    lupa: { code: "1F50D", alt: "Uma lupa." },
    faca: { code: "1F52A", alt: "Uma faca de cozinha." },
    vida: { code: "1F331", alt: "Uma planta a crescer, cheia de vida." },
    toma: { code: "", alt: "Uma mão a dar um pequeno objeto a outra." },
    lua: { code: "1F319", alt: "A lua no céu." },
    leão: { code: "1F981", alt: "Um leão." },
    cão: { code: "1F415", alt: "Um cão." },
    mãe: { code: "1F469-200D-1F37C", alt: "Uma mãe a alimentar o seu bebé." },
    pão: { code: "1F35E", alt: "Um pão." },
    avó: { code: "1F475", alt: "Uma avó." },
    avô: { code: "1F474", alt: "Um avô." },
    café: { code: "2615", alt: "Uma chávena de café." },
    maçã: { code: "1F34E", alt: "Uma maçã vermelha." },
    lã: { code: "1F9F6", alt: "Um novelo de lã." },
    pé: { code: "1F9B6", alt: "Um pé." },
    céu: { code: "1F324", alt: "O céu com sol e uma nuvem." },
    mão: { code: "270B", alt: "Uma mão aberta." },
    botão: { code: "1F518", alt: "Um botão redondo." },
    chá: { code: "1F375", alt: "Uma chávena de chá." },
    chave: { code: "1F511", alt: "Uma chave." },
    filho: { code: "1F466", alt: "Um filho pequeno." },
    ninho: { code: "1FAB9", alt: "Um ninho com ovos." },
    banho: { code: "1F6C1", alt: "Uma banheira com água." },
    carro: { code: "1F697", alt: "Um carro." },
    massa: { code: "1F35D", alt: "Um prato de massa." },
    terra: { code: "1F30D", alt: "O planeta Terra." },
    prato: { code: "1F37D", alt: "Um prato com talheres." },
    livro: { code: "1F4D6", alt: "Um livro aberto." },
    flor: { code: "1F33C", alt: "Uma flor." },
    trapo: { code: "", alt: "Um trapo de pano dobrado." },
  };

export function getWordIllustration(word: string): {
  imageAsset: string;
  imageAlt: string;
} {
  const illustration = wordIllustrations[word];
  if (!illustration) throw new Error(`Missing illustration for ${word}`);
  return {
    imageAsset: `/images/word-${word}.svg`,
    imageAlt: illustration.alt,
  };
}
