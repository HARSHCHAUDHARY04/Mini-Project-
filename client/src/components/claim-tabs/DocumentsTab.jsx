import React from "react";
import { Field } from "./Shared";

export default function DocumentsTab({ claim, policy, clinicalDoc }) {
  return (
    <div className="card p-6 space-y-4">
      <Field label="Source Claim File" value={claim.sourceFile || "Loaded from synthetic demo bundle"} />
      {policy && <Field label="Policy Document" value={policy.policyName} />}
      {clinicalDoc && <Field label="Clinical Document" value={clinicalDoc.title} />}
    </div>
  );
}
