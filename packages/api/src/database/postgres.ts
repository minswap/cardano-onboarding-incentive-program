import { PrismaClient } from "@prisma/client";

class DBClient {
	public prisma: PrismaClient;
	private static instance: DBClient;
	private constructor(url: string) {
		this.prisma = new PrismaClient({
			datasources: {
				db: {
					url,
				},
			},
			log: [
				{ emit: "stdout", level: "error" },
				{ emit: "stdout", level: "warn" },
				{ emit: "stdout", level: "info" },
				{ emit: "event", level: "query" },
			],
		});
	}

	public static getInstance(url: string) {
		if (!DBClient.instance) {
			DBClient.instance = new DBClient(url);
		}
		return DBClient.instance;
	}
}

export default DBClient;
