import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSkillArmorCheckPenalty", (fact, context) => {
        const armor = fact.armor;
        const skills = fact.data.skills;
        const modifiers = fact.modifiers;
        const flags = fact.flags;

        const addModifier = (bonus) => {
            let mod = 0;
            if (bonus.valueAffected === "acp-light" && armor.data.armor.type === "light") {
                mod += bonus.modifier;
            }
            else if (bonus.valueAffected === "acp-heavy" && armor.data.armor.type === "heavy") {
                mod += bonus.modifier;
            }
            else {
                mod += bonus.modifier;
            }

            return mod;
        };

        /** @deprecated Will be removed in 0.4.0 */
        const armorSavant = getProperty(flags, 'starfinder.armorSavant') ? 1 : 0;

        const acpMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.ACP].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(acpMods, context);
        let mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(curr[1].type)) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus);
                }
            }
            else {
                prev += addModifier(curr[1]);
            }

            return prev;
        }, 0);

        if (armorSavant > 0) mod += armorSavant;

        for (const skill of Object.values(skills)) {
            let acp = armor && armor.data.armor.acp < 0 && skill.hasArmorCheckPenalty ? armor.data.armor.acp : 0;
            if (acp < 0 && mod > 0) acp = Math.min(acp + mod, 0);

            skill.mod += acp;

            if (acp >= 0) continue;
            const tooltip = game.i18n.format("STARFINDER.ACPTooltip", {acp: acp.signedString()});
            if (!skill.tooltip) skill.tooltip = [tooltip];
            else skill.tooltip.push(tooltip);
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}