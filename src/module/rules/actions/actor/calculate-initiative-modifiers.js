import { StarfinderModifierType, StarfinderEffectType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const init = data.attributes.init;
        const modifiers = fact.modifiers;

        init.tooltip = init.tooltip ?? [];

        const addModifer = (bonus) => {
            let mod = bonus.modifier;
            if (mod !== 0) {
                init.tooltip.push(game.i18n.format("STARFINDER.InitiativeModiferTooltip", {
                    type: bonus.type.capitalize(),
                    source: bonus.name,
                    mod: mod.signedString()
                }));
            }

            return mod;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.INITIATIVE].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(filteredMods, context);

        const mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    prev += addModifer(bonus);
                }
            } else {
                prev += addModifer(curr[1]);
            }

            return prev;
        }, 0);

        /** @deprecated will be removed in v0.4.0 */
        const improvedInitiative = getProperty(flags, "starfinder.improvedInititive") ? 4 : 0;
        const rapidResponse = getProperty(flags, "starfinder.rapidResponse") ? 4 : 0;

        init.bonus = init.value + improvedInitiative + rapidResponse + mod;

        init.total += init.bonus;

        if (improvedInitiative !== 0) init.tooltip.push(game.i18n.format("STARFINDER.InitiativeModiferTooltip", {
            type: StarfinderModifierTypes.UNTYPED.capitalize(),
            source: "Improved Initiative",
            mod: improvedInitiative.signedString()
        }));

        if (rapidResponse !== 0) init.tooltip.push(game.i18n.format("STARFINDER.InitiativeModiferTooltip", {
            type: StarfinderModifierTypes.UNTYPED.capitalize(),
            source: "Rapid Response",
            mod: rapidResponse.signedString()
        }));

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}