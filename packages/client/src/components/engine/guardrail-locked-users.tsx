import { LockOpen } from "lucide-react";
import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { PersonIdentity } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Muted,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { getErrorMessage } from "@semoss/utility/error";
import {
	clearEngineGuardrailLockPixel,
	type EngineGuardrailLock,
	engineGuardrailLocksQuery,
	parseEngineGuardrailLocks,
} from "@/api/guardrails";
import { useSession } from "@/hooks";

export interface GuardrailLockedUsersProps {
	/** The engine whose locks are listed */
	engineId: string;

	/** Whether the viewer can unlock a user */
	isEditable: boolean;
}

/** A lock's user, by login type and id, as a list key */
const lockKey = (lock: EngineGuardrailLock): string =>
	`${lock.userType}:${lock.userId}`;

/**
 * The users locked out of an engine after their guardrail hits reached one of
 * its limits, each with when the lock ends and a way to unlock them now.
 */
export const GuardrailLockedUsers = ({
	engineId,
	isEditable,
}: GuardrailLockedUsersProps) => {
	const runPixel = useSession((state) => state.runPixel);
	const locks = usePixel<unknown>(engineGuardrailLocksQuery(engineId));
	const [unlockingKey, setUnlockingKey] = useState<string | null>(null);

	let rows: EngineGuardrailLock[] = [];
	let readError = locks.error?.message ?? null;
	if (locks.status === "SUCCESS") {
		try {
			rows = parseEngineGuardrailLocks(locks.data);
		} catch (cause: unknown) {
			readError = getErrorMessage(
				cause,
				"Unable to read the locked users.",
			);
		}
	}

	const handleUnlock = async (lock: EngineGuardrailLock) => {
		setUnlockingKey(lockKey(lock));
		try {
			const response = await runPixel(
				clearEngineGuardrailLockPixel(
					engineId,
					lock.userId,
					lock.userType,
				),
			);
			const result = response.pixelReturn?.[0];
			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(result?.output || "Unable to unlock the user."),
				);
			}
			toast.success(
				`${lock.name ?? lock.userId} can use this engine again`,
			);
			locks.refresh();
		} catch (error: unknown) {
			toast.error(getErrorMessage(error, "Unable to unlock the user."));
		} finally {
			setUnlockingKey(null);
		}
	};

	const isReading = locks.status === "INITIAL" || locks.status === "LOADING";

	return (
		<Card data-testid="engine-guardrail-locked-users">
			<CardHeader className="border-b">
				<CardTitle>Locked Users</CardTitle>
				<CardDescription>
					Users locked out of this engine after their hits reached a
					hit limit. Unlocking lets them use it again now.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{readError ? (
					<Alert variant="destructive">
						<AlertDescription>{readError}</AlertDescription>
					</Alert>
				) : isReading ? (
					<div className="flex min-h-16 items-center justify-center">
						<Spinner />
					</div>
				) : rows.length === 0 ? (
					<Muted>No one is locked out of this engine.</Muted>
				) : (
					<ul className="divide-y">
						{rows.map((lock) => {
							const key = lockKey(lock);
							const isUnlocking = unlockingKey === key;
							return (
								<li
									key={key}
									className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
								>
									<PersonIdentity
										name={lock.name ?? lock.userId}
										type={lock.userType}
										id={lock.userId}
										email={lock.email}
										className="min-w-0 flex-1"
									>
										<span className="text-muted-foreground text-xs">
											Locked until{" "}
											{formatLocalDateTime(
												lock.lockedUntil,
											) ?? lock.lockedUntil}
										</span>
									</PersonIdentity>
									{isEditable && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => handleUnlock(lock)}
											disabled={unlockingKey !== null}
											data-testid={`engine-guardrail-locked-users-unlock-${key}`}
										>
											{isUnlocking ? (
												<Spinner className="size-4" />
											) : (
												<LockOpen
													className="size-4"
													aria-hidden
												/>
											)}
											{isUnlocking
												? "Unlocking..."
												: "Unlock"}
										</Button>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
};
