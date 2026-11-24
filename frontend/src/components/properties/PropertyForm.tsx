"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/FormControls";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { clientFetch } from "@/lib/clientApi";
import { useToast } from "@/context/ToastContext";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/format";
import type { PropertyDetailData, PropertyFormValues, PropertyImage } from "@/lib/types";

const AMENITY_OPTIONS = [
  "Parking", "Lift", "Power Backup", "Gym", "Swimming Pool", "Security", "Clubhouse",
  "Garden", "Children's Play Area", "Water Supply 24x7", "Gas Pipeline", "Visitor Parking",
];

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EMPTY_VALUES: PropertyFormValues = {
  title: "", description: "", propertyType: "apartment", listingType: "sale", price: "",
  bedrooms: "2", bathrooms: "2", areaSqft: "", addressLine: "", locality: "", city: "",
  state: "", pincode: "", amenities: [],
};

function valuesFromProperty(property: PropertyDetailData): PropertyFormValues {
  return {
    title: property.title, description: property.description, propertyType: property.propertyType,
    listingType: property.listingType, price: String(property.price), bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms), areaSqft: String(property.areaSqft), addressLine: property.addressLine,
    locality: property.locality, city: property.city, state: property.state, pincode: property.pincode,
    amenities: property.amenities,
  };
}

function validate(values: PropertyFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.title.trim().length < 10) errors.title = "Title must be at least 10 characters";
  if (values.description.trim().length < 30) errors.description = "Description must be at least 30 characters";
  if (!Number.isInteger(Number(values.price)) || Number(values.price) <= 0) errors.price = "Enter the price as a whole number";
  if (!Number.isInteger(Number(values.areaSqft)) || Number(values.areaSqft) < 50) errors.areaSqft = "Area must be at least 50 sq ft";
  if (values.addressLine.trim().length < 5) errors.addressLine = "Enter the street address";
  if (values.locality.trim().length < 2) errors.locality = "Locality is required";
  if (values.city.trim().length < 2) errors.city = "City is required";
  if (values.state.trim().length < 2) errors.state = "State is required";
  if (!/^\d{6}$/.test(values.pincode.trim())) errors.pincode = "Pincode must be 6 digits";
  return errors;
}

type PropertyFormProps = { mode: "create"; } | { mode: "edit"; property: PropertyDetailData; };

export function PropertyForm(props: PropertyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = props.mode === "edit" ? props.property : null;

  const [values, setValues] = useState<PropertyFormValues>(editing ? valuesFromProperty(editing) : EMPTY_VALUES);
  const [status, setStatus] = useState<"active" | "inactive">(editing?.status ?? "active");
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(editing?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedListingId, setSavedListingId] = useState<number | null>(null);

  const isPlot = values.propertyType === "plot";

  const previews = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const change = (field: keyof PropertyFormValues) => (event: { target: { value: string; }; }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  };

  function toggleAmenity(amenity: string) {
    setValues((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    const files = Array.from(selected);
    setFileError(null);

    const rejected = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (rejected) return setFileError(`"${rejected.name}" must be a JPEG, PNG or WebP image under 5 MB.`);
    if (existingImages.length + newFiles.length + files.length > MAX_IMAGES) {
      return setFileError(`A listing can have at most ${MAX_IMAGES} photos.`);
    }
    setNewFiles((current) => [...current, ...files]);
  }

  async function removeExistingImage(image: PropertyImage) {
    if (!editing) return;
    try {
      await clientFetch(`/api/properties/${editing.id}/images/${image.id}`, { method: "DELETE" });
      setExistingImages((current) => current.filter((item) => item.id !== image.id));
    } catch (error) {
      setFileError(errorMessage(error));
    }
  }

  async function uploadPhotos(propertyId: number) {

    for (let start = 0; start < newFiles.length; start += 5) {
      const formData = new FormData();
      newFiles.slice(start, start + 5).forEach((file) => formData.append("images", file));
      await clientFetch(`/api/properties/${propertyId}/images`, { method: "POST", formData });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const problems = validate(values);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) {
      setFormError("Please fix the highlighted fields.");
      toast("error", Object.values(problems)[0]);
      const first = document.getElementById(Object.keys(problems)[0]);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => first?.focus(), 250);
      return;
    }

    const payload = {
      title: values.title.trim(), description: values.description.trim(),
      propertyType: values.propertyType, listingType: values.listingType,
      price: Number(values.price), bedrooms: isPlot ? 0 : Number(values.bedrooms), bathrooms: isPlot ? 0 : Number(values.bathrooms),
      areaSqft: Number(values.areaSqft), addressLine: values.addressLine.trim(), locality: values.locality.trim(),
      city: values.city.trim(), state: values.state.trim(), pincode: values.pincode.trim(), amenities: values.amenities,
    };

    setSubmitting(true);
    let listingId = editing?.id ?? null;
    try {
      if (editing) {
        await clientFetch(`/api/properties/${editing.id}`, { method: "PUT", body: { ...payload, status } });
      } else {
        const created = await clientFetch<{ data: PropertyDetailData; }>("/api/properties", { method: "POST", body: payload });
        listingId = created.data.id;
        setSavedListingId(listingId);
      }
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error));
      setFormError(errorMessage(error));
      toast("error", errorMessage(error));
      const firstError = Object.keys(fieldErrorsFrom(error))[0];
      const field = firstError ? document.getElementById(firstError) : null;
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => field?.focus(), 250);
      setSubmitting(false);
      return;
    }

    try {
      if (newFiles.length > 0 && listingId) await uploadPhotos(listingId);
      toast("success", editing ? "Property updated successfully." : "Property created successfully.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {

      setFormError(`Your listing was saved, but photo upload failed: ${errorMessage(error)}`);
      toast("error", "The listing was saved, but photo upload failed. Open your listing to retry.");
      setSubmitting(false);
    }
  }

  const err = (field: string) => fieldErrors[field];

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <header className="mb-2">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-800"><span aria-hidden>←</span> Back to dashboard</Link>
        <div className="mt-5 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">Property workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{editing ? "Refine your listing" : "List your property"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{editing ? "Keep the details accurate so the right people can find your property." : "A few thoughtful details help buyers and tenants picture their next home."}</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900"><span className="h-1.5 w-1.5 rounded-full bg-teal-600" />{editing ? "Editing listing" : "Free property listing"}</span>
        </div>
      </header>
      {formError && (
        <Alert variant="error">
          {formError}{" "}
          {savedListingId && (
            <Link href={`/dashboard/properties/${savedListingId}/edit`} className="font-semibold underline">
              Open the listing to add photos again
            </Link>
          )}
        </Alert>
      )}

      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-7">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-900">01</span><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">Property details</h2><p className="mt-1 text-sm text-slate-500">Tell people what makes this property right for them.</p></div></div>
        <Field label="Title" htmlFor="title" required error={err("title")} hint="e.g. 3 BHK apartment">
          <TextInput id="title" value={values.title} onChange={change("title")} error={err("title")} maxLength={150} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property type" htmlFor="propertyType" required error={err("propertyType")}>
            <SelectInput id="propertyType" value={values.propertyType} onChange={change("propertyType")}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectInput>
          </Field>
          <Field label="Listing type" htmlFor="listingType" required error={err("listingType")}>
            <SelectInput id="listingType" value={values.listingType} onChange={change("listingType")}>
              {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectInput>
          </Field>
          <Field label={values.listingType === "rent" ? "Monthly rent (₹)" : "Price (₹)"} htmlFor="price" required error={err("price")}>
            <TextInput id="price" type="number" min={1} inputMode="numeric" value={values.price} onChange={change("price")} error={err("price")} />
          </Field>
          <Field label="Area (sq ft)" htmlFor="areaSqft" required error={err("areaSqft")}>
            <TextInput id="areaSqft" type="number" min={50} inputMode="numeric" value={values.areaSqft} onChange={change("areaSqft")} error={err("areaSqft")} />
          </Field>
          {!isPlot && (
            <>
              <Field label="Bedrooms" htmlFor="bedrooms" required error={err("bedrooms")}>
                <SelectInput id="bedrooms" value={values.bedrooms} onChange={change("bedrooms")}>
                  {Array.from({ length: 11 }, (_, count) => <option key={count} value={count}>{count}</option>)}
                </SelectInput>
              </Field>
              <Field label="Bathrooms" htmlFor="bathrooms" required error={err("bathrooms")}>
                <SelectInput id="bathrooms" value={values.bathrooms} onChange={change("bathrooms")}>
                  {Array.from({ length: 11 }, (_, count) => <option key={count} value={count}>{count}</option>)}
                </SelectInput>
              </Field>
            </>
          )}
        </div>
        <Field label="Description" htmlFor="description" required error={err("description")} hint="Describe the property, neighbourhood and nearby facilities (min 30 characters)">
          <TextArea id="description" rows={5} maxLength={5000} value={values.description} onChange={change("description")} error={err("description")} />
        </Field>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-7">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-900">02</span><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">Where it is</h2><p className="mt-1 text-sm text-slate-500">A clear location helps people understand the neighbourhood.</p></div></div>
        <Field label="Street address" htmlFor="addressLine" required error={err("addressLine")}>
          <TextInput id="addressLine" value={values.addressLine} onChange={change("addressLine")} error={err("addressLine")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Locality" htmlFor="locality" required error={err("locality")}>
            <TextInput id="locality" value={values.locality} onChange={change("locality")} error={err("locality")} />
          </Field>
          <Field label="City" htmlFor="city" required error={err("city")}>
            <TextInput id="city" value={values.city} onChange={change("city")} error={err("city")} />
          </Field>
          <Field label="State" htmlFor="state" required error={err("state")}>
            <TextInput id="state" value={values.state} onChange={change("state")} error={err("state")} />
          </Field>
          <Field label="Pincode" htmlFor="pincode" required error={err("pincode")}>
            <TextInput id="pincode" inputMode="numeric" maxLength={6} value={values.pincode} onChange={change("pincode")} error={err("pincode")} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-7">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-900">03</span><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">Amenities</h2><p className="mt-1 text-sm text-slate-500">Select the features available in the property.</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITY_OPTIONS.map((amenity) => (
            <label key={amenity} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${values.amenities.includes(amenity) ? "border-teal-200 bg-teal-50 text-teal-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
              <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={values.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
              {amenity}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-7">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-900">04</span><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">Property photos</h2><p className="mt-1 text-sm text-slate-500">Bright, clear photos help your listing stand out.</p></div></div>
        {fileError && <Alert variant="error">{fileError}</Alert>}

        {existingImages.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {existingImages.map((image) => (
              <li key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">

                <img src={image.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(image)} className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {previews.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((url, index) => (
              <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 ring-2 ring-teal-500">

                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setNewFiles((files) => files.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center transition hover:border-teal-300 hover:bg-teal-50/50 sm:px-6">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-teal-800 shadow-sm ring-1 ring-slate-200" aria-hidden><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg></span>
          <p className="mt-3 text-sm font-semibold text-slate-900">Add photos of your property</p>
          <p className="mt-1 text-xs text-slate-500">Choose up to {MAX_IMAGES} clear images. JPEG, PNG or WebP, max 5 MB each.</p>
          <label htmlFor="photos" className={`${buttonClasses("secondary", "sm")} mt-4 !rounded-xl !px-4 cursor-pointer`}>Browse photos</label>
          <input id="photos" type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple className="sr-only"
            onChange={(event) => { handleFilesSelected(event.target.files); event.target.value = ""; }} />
          <p className="mt-2 text-xs text-slate-400">The first photo is used as your cover image.</p>
        </div>
      </section>

      {editing && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <Field label="Visibility" htmlFor="status" hint="Inactive listings are hidden from search but kept in your dashboard.">
            <SelectInput id="status" value={status} onChange={(event) => setStatus(event.target.value as "active" | "inactive")}>
              <option value="active">Active - visible to everyone</option>
              <option value="inactive">Inactive - hidden</option>
            </SelectInput>
          </Field>
        </section>
      )}

      <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur sm:static sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
        <Link href="/dashboard" className={`${buttonClasses("secondary")} !rounded-xl`}>Cancel</Link>
        <Button type="submit" loading={submitting} className="!rounded-xl !px-5">{editing ? "Save changes" : "Publish listing"}</Button>
      </div>
    </form>
  );
}
