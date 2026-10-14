-- CreateIndex
CREATE INDEX "audit_logs_officeId_idx" ON "audit_logs"("officeId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_id_idx" ON "audit_logs"("createdAt" DESC, "id" DESC);
