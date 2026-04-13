import { supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  // Convert numbers and other types to string
  return String(v).trim();
}

function toNum(v) {
  // Convert to number or null (for empty strings)
  if (v === null || v === undefined || v === '') return null;
  const num = typeof v === 'string' ? parseFloat(v.trim()) : Number(v);
  return isNaN(num) ? null : num;
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    const id = toStr(body?.id);
    const status = toStr(body?.status);
    const kycStatus = toStr(body?.kycStatus);

    if (!id) return Response.json({ error: 'id is required' }, { status:400 });
    if (!status && !kycStatus && !body?.name && !body?.owner && !body?.contactNumber && !body?.email && !body?.state && !body?.city && !body?.category && body?.pincode === undefined && body?.rating === undefined && body?.reviewCount === undefined && body?.imageUrl === undefined && body?.image_url === undefined && body?.shopFrontPhotoUrl === undefined && body?.shop_front_photo_url === undefined && body?.idProofUrl === undefined && body?.id_proof_url === undefined && body?.shopProofUrl === undefined && body?.shop_proof_url === undefined) {
      return Response.json({ error: 'At least one field to update is required' }, { status: 400 });
    }

    const patch = {};
    if (status) patch.status = status;
    if (kycStatus) patch.kyc_status = kycStatus;
    if (body?.name !== undefined) patch.name = toStr(body.name);
    if (body?.owner !== undefined) {
      const ownerVal = toStr(body.owner);
      patch.owner = ownerVal || null;
      patch.owner_name = ownerVal || null;
    }
    if (body?.owner_name !== undefined) {
      const ownerVal = toStr(body.owner_name);
      patch.owner_name = ownerVal || null;
    }
    if (body?.contactNumber !== undefined) {
      const contactVal = toStr(body.contactNumber);
      patch.contact_number = contactVal || null;
    }
    if (body?.contact_number !== undefined) {
      const contactVal = toStr(body.contact_number);
      patch.contact_number = contactVal || null;
    }
    if (body?.email !== undefined) {
      const emailVal = toStr(body.email);
      patch.email = emailVal || null;
    }
    if (body?.state !== undefined) {
      const stateVal = toStr(body.state);
      patch.state = stateVal || null;
    }
    if (body?.city !== undefined) {
      const cityVal = toStr(body.city);
      patch.city = cityVal || null;
    }
    if (body?.town !== undefined) {
      const townVal = toStr(body.town);
      patch.town = townVal || null;
    }
    if (body?.tehsil !== undefined) {
      const tehsilVal = toStr(body.tehsil);
      patch.tehsil = tehsilVal || null;
    }
    if (body?.subTehsil !== undefined) {
      patch.sub_tehsil = toStr(body.subTehsil) || null;
    }
    if (body?.sub_tehsil !== undefined) {
      patch.sub_tehsil = toStr(body.sub_tehsil) || null;
    }
    if (body?.category !== undefined) {
      const categoryVal = toStr(body.category);
      patch.category = categoryVal || null;
    }
    if (body?.circle !== undefined) {
      const circleVal = toStr(body.circle);
      patch.circle = circleVal || null;
    }
    
    // Handle numeric fields - convert empty strings to null (only if explicitly provided)
    // Don't include these fields if they're not in the request body
    if (body?.pincode !== undefined) {
      patch.pincode = toNum(body.pincode);
    }
    if (body?.rating !== undefined) {
      patch.rating = toNum(body.rating);
    }
    if (body?.reviewCount !== undefined) {
      patch.review_count = toNum(body.reviewCount);
    }
    if (body?.review_count !== undefined) {
      patch.review_count = toNum(body.review_count);
    }
    if (body?.address !== undefined) {
      const addressVal = toStr(body.address);
      patch.address = addressVal || null;
    }
    if (body?.landmark !== undefined) {
      const landmarkVal = toStr(body.landmark);
      patch.landmark = landmarkVal || null;
    }
    if (body?.imageUrl !== undefined) {
      const imageVal = toStr(body.imageUrl);
      patch.image_url = imageVal || null;
    }
    if (body?.image_url !== undefined) {
      const imageVal = toStr(body.image_url);
      patch.image_url = imageVal || null;
    }
    if (body?.shopFrontPhotoUrl !== undefined) {
      const shopPhotoVal = toStr(body.shopFrontPhotoUrl);
      patch.shop_front_photo_url = shopPhotoVal || null;
    }
    if (body?.shop_front_photo_url !== undefined) {
      const shopPhotoVal = toStr(body.shop_front_photo_url);
      patch.shop_front_photo_url = shopPhotoVal || null;
    }
    if (body?.idProofUrl !== undefined) {
      patch.id_proof_url = toStr(body.idProofUrl) || null;
    }
    if (body?.id_proof_url !== undefined) {
      patch.id_proof_url = toStr(body.id_proof_url) || null;
    }
    if (body?.shopProofUrl !== undefined) {
      patch.shop_proof_url = toStr(body.shopProofUrl) || null;
    }
    if (body?.shop_proof_url !== undefined) {
      patch.shop_proof_url = toStr(body.shop_proof_url) || null;
    }

    const updated = await supabaseRestPatch(`/rest/v1/vendors?id=eq.${encodeURIComponent(id)}`, patch);
    return Response.json({ vendor: Array.isArray(updated) ? updated[0] : updated }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to update vendor' }, { status: 500 });
  }
}

