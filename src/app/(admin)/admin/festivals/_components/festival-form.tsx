import type { Festival } from "@prisma/client";

type PartialFestival = Partial<Festival>;

interface FestivalFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: PartialFestival;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-surface-elevated)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-main)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-base)",
  padding: "8px 12px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-xs)",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

function Field({
  name,
  label,
  defaultValue,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--danger-red)", marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue?.toString() ?? ""}
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--danger-red)", marginLeft: 2 }}>*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? undefined}
        style={{
          ...inputStyle,
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FestivalForm({ action, defaultValues }: FestivalFormProps) {
  const startDateDefault = defaultValues?.startDate
    ? new Date(defaultValues.startDate).toISOString().slice(0, 10)
    : "";
  const endDateDefault = defaultValues?.endDate
    ? new Date(defaultValues.endDate).toISOString().slice(0, 10)
    : "";

  return (
    <form
      action={action}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        maxWidth: 720,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <Field name="name" label="Nom" defaultValue={defaultValues?.name} required />
        <Field name="slug" label="Slug (URL)" defaultValue={defaultValues?.slug} required />
      </div>

      <div>
        <label htmlFor="description" style={labelStyle}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
        <Field name="city" label="Ville" defaultValue={defaultValues?.city} required />
        <Field name="country" label="Pays" defaultValue={defaultValues?.country} required />
        <Field name="address" label="Adresse" defaultValue={defaultValues?.address} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <Field
          name="startDate"
          label="Date de début"
          defaultValue={startDateDefault}
          required
          type="date"
        />
        <Field
          name="endDate"
          label="Date de fin"
          defaultValue={endDateDefault}
          required
          type="date"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <SelectField
          name="festivalType"
          label="Type de festival"
          defaultValue={defaultValues?.festivalType ?? "multidisciplinaire"}
          required
          options={[
            { value: "musique", label: "Musique" },
            { value: "theatre_rue", label: "Théâtre de rue" },
            { value: "cirque", label: "Cirque" },
            { value: "world", label: "World" },
            { value: "multidisciplinaire", label: "Multidisciplinaire" },
            { value: "autre", label: "Autre" },
          ]}
        />
        <SelectField
          name="programType"
          label="Type de programme"
          defaultValue={defaultValues?.programType ?? "structuré"}
          required
          options={[
            { value: "structuré", label: "Structuré" },
            { value: "déambulatoire", label: "Déambulatoire" },
            { value: "hybride", label: "Hybride" },
          ]}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <Field name="siteUrl" label="Site web" defaultValue={defaultValues?.siteUrl} />
        <Field
          name="instagramHandle"
          label="Instagram (@)"
          defaultValue={defaultValues?.instagramHandle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
        <SelectField
          name="ingestionStatus"
          label="Statut d'ingestion"
          defaultValue={defaultValues?.ingestionStatus ?? "détecté"}
          options={[
            { value: "détecté", label: "Détecté" },
            { value: "vérifié", label: "Vérifié" },
            { value: "enrichi", label: "Enrichi" },
          ]}
        />
        <SelectField
          name="confidenceLevel"
          label="Niveau de confiance"
          defaultValue={defaultValues?.confidenceLevel ?? "auto"}
          options={[
            { value: "auto", label: "Auto" },
            { value: "vérifié_humain", label: "Vérifié humain" },
          ]}
        />
      </div>

      <div style={{ paddingTop: "var(--space-sm)" }}>
        <button
          type="submit"
          style={{
            padding: "12px 32px",
            background: "var(--primary-neon)",
            color: "var(--text-on-neon)",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          Sauvegarder
        </button>
      </div>
    </form>
  );
}
