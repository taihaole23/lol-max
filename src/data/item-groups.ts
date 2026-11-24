// Shop rules that decide which items can be in the same build.

// Item groups: a build may hold at most ONE item from each group.
// Example: Void Staff and Terminus are both "Blight", so they can't be built together.
// An item can be in two groups: Terminus is in Blight AND Fatality.
//
// Source: the wiki's item data module, which is what each item page's "Limitations"
// section is made from (the `itemlimit` fields). We read it for every legendary and boots item.
// The wiki's "Item group" overview page is older (V26.12), so we don't use it.
//
// Some groups have only one member here. Their other members are components
// or items from other game modes, so they never block anything in our pool.
// We keep them anyway so this list matches the wiki exactly.
//
// Two items that share a passive NAME but no group (Rapid Firecannon + Statikk Shiv,
// both "Energized") CAN be built together, as in the real shop. Their passive just
// doesn't stack; that's handled where the passive is coded (Step 5d).
export const itemGroups = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Module:ItemData/data", patch: "26.23" },
  groups: {
    Annul: ["Banshee's Veil", "Edge of Night"],
    Blight: ["Bloodletter's Curse", "Cryptbloom", "Terminus", "Void Staff"],
    Eternity: ["Rod of Ages"],
    Fatality: ["Black Cleaver", "Lord Dominik's Regards", "Mortal Reminder", "Serylda's Grudge", "Terminus"],
    Glory: ["Mejai's Soulstealer"],
    Hydra: ["Profane Hydra", "Ravenous Hydra", "Stridebreaker", "Titanic Hydra"],
    Immolate: ["Hollow Radiance", "Sunfire Aegis"],
    Lifeline: ["Archangel's Staff", "Immortal Shieldbow", "Maw of Malmortius", "Protoplasm Harness", "Sterak's Gage"],
    Manaflow: ["Archangel's Staff", "Manamune", "Winter's Approach"],
    Momentum: ["Dead Man's Plate"],
    Quicksilver: ["Mercurial Scimitar"],
    Spellblade: ["Dusk and Dawn", "Essence Reaver", "Iceborn Gauntlet", "Lich Bane", "Trinity Force"],
    Stasis: ["Zhonya's Hourglass"],
  } as Record<string, readonly string[]>,
};

// Items a melee champion can't buy at all. Every playable champion is melee (each data file's
// `rangeType`; a test checks it), so the item pool leaves these out for everyone.
export const meleeCannotBuy = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Runaan%27s_Hurricane", patch: "26.23" },
  items: ["Runaan's Hurricane"], // "Can only be purchased on ranged champions."
};
