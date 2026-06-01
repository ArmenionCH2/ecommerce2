'use server';

/**
 * ADMIN CONTROL SERVER ACTIONS
 *
 * All actions require admin role (enforced by RLS + server-side role check).
 * These are the only functions that can write to profiles.metadata
 * or toggle product is_active outside of the owning seller.
 */

import { createServerClient } from '@/lib/supabaseServer';

async function writeAuditLog(supabase: ReturnType<typeof createServerClient>, entry: {
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  reason?: string;
}) {
  await supabase.from('admin_audit_log').insert(entry);
  // Errors are intentionally swallowed — audit failure must never block the action
}

/** Approve a seller vendor account by setting is_verified in metadata */
export async function approveVendor(sellerId: string, adminId: string): Promise<{ success: boolean }> {
  const supabase = createServerClient();
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ metadata: { is_verified: true } })
      .eq('id', sellerId)
      .eq('role', 'seller');

    if (!error) {
      await writeAuditLog(supabase, {
        admin_id: adminId,
        action_type: 'APPROVE_VENDOR',
        target_type: 'profile',
        target_id: sellerId,
        new_values: { metadata: { is_verified: true } },
      });
    }

    return { success: !error };
  } catch (err) {
    console.error('approveVendor error:', err);
    return { success: false };
  }
}

/** Soft-deactivate a product (never hard delete) */
export async function deactivateProduct(productId: number, adminId: string): Promise<{ success: boolean }> {
  const supabase = createServerClient();
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (!error) {
      await writeAuditLog(supabase, {
        admin_id: adminId,
        action_type: 'DEACTIVATE_PRODUCT',
        target_type: 'product',
        target_id: String(productId),
        new_values: { is_active: false },
      });
    }

    return { success: !error };
  } catch (err) {
    console.error('deactivateProduct error:', err);
    return { success: false };
  }
}

/** Update an order's status (admin override path) */
export async function updateOrderStatus(
  orderId : number,
  status  : 'placed' | 'packed' | 'to_receive' | 'received' | 'cancelled',
  adminId: string
): Promise<{ success: boolean }> {
  const supabase = createServerClient();
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (!error) {
      await writeAuditLog(supabase, {
        admin_id: adminId,
        action_type: 'UPDATE_ORDER_STATUS',
        target_type: 'order',
        target_id: String(orderId),
        new_values: { status },
      });
    }

    return { success: !error };
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return { success: false };
  }
}
