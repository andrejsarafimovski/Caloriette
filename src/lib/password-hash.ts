import crypto from "crypto";

import { config } from "../config";

export function hashPassword(password: string): string {
    const hash = crypto.createHmac("sha256", config.hash.secret)
        .update(password).digest("base64");
    return hash;
}
