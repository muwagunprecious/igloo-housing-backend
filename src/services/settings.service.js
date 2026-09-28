const { prisma } = require('../config/db');

class SettingsService {
    /**
     * Get a setting by key
     */
    async getSetting(key, defaultValue = null) {
        try {
            const rows = await prisma.$queryRawUnsafe(
                'SELECT value FROM system_settings WHERE key = $1 LIMIT 1',
                key
            );
            if (rows && rows.length > 0) {
                return rows[0].value;
            }
            return defaultValue;
        } catch (error) {
            console.warn(`Settings lookup for ${key} failed, using default:`, error.message);
            return defaultValue;
        }
    }

    /**
     * Set a setting by key
     */
    async setSetting(key, value) {
        const strVal = String(value);
        await prisma.$executeRawUnsafe(
            `INSERT INTO system_settings (id, key, value, "updatedAt")
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, "updatedAt" = NOW()`,
            `setting_${key}`,
            key,
            strVal
        );
        return { key, value: strVal };
    }

    /**
     * Get current agent verification fee (in Naira)
     */
    async getAgentFee() {
        const raw = await this.getSetting('agent_verification_fee', '2000');
        const parsed = parseInt(raw, 10);
        return isNaN(parsed) || parsed < 0 ? 2000 : parsed;
    }

    /**
     * Set agent verification fee (in Naira)
     */
    async setAgentFee(amount) {
        const num = parseInt(amount, 10);
        if (isNaN(num) || num < 0) {
            throw { message: 'Agent verification fee must be a valid non-negative number', statusCode: 400 };
        }
        await this.setSetting('agent_verification_fee', num);
        return { agentFee: num };
    }
}

module.exports = new SettingsService();
