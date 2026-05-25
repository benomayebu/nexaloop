-- CreateTable
CREATE TABLE "OrgInviteToken" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgInviteToken_tokenHash_key" ON "OrgInviteToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OrgInviteToken_tokenHash_idx" ON "OrgInviteToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OrgInviteToken_orgId_email_idx" ON "OrgInviteToken"("orgId", "email");

-- AddForeignKey
ALTER TABLE "OrgInviteToken" ADD CONSTRAINT "OrgInviteToken_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgInviteToken" ADD CONSTRAINT "OrgInviteToken_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
