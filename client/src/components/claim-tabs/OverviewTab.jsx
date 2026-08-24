import React from "react";
import StatusBadge from "../StatusBadge";
import { Field } from "./Shared";

export default function OverviewTab({ claim }) {
  return (
    <div className="card p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Field label="Claim ID" value={claim.claimId} />
      <Field label="Patient" value={claim.patientName || claim.patientId} />
      <Field label="Payer" value={claim.payer} />
      <Field label="Procedure" value={`${claim.procedure} ${claim.procedureCode ? `(${claim.procedureCode})` : ""}`} />
      <Field label="Amount" value={`$${(claim.amount || 0).toLocaleString()}`} />
      <Field label="Denial Code" value={claim.denialCode} />
      <Field label="Date of Service" value={claim.dateOfService} />
      <Field label="Provider" value={claim.provider} />
      <Field label="Status" value={<StatusBadge status={claim.status} />} />
    </div>
  );
}
