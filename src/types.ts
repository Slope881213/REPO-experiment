export type IntroFirstNeed = 'Bed' | 'Lamp' | 'Desk' | 'Kitchen items' | '';

export interface SellerItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  condition: 'Like new' | 'Good' | 'Fair';
  departureDate: string;
  published: boolean;
}

export interface BuyerItem {
  id: string;
  name: string;
  price: number;
  seller: string;
  verified: boolean;
  image: string;
}

export interface AnalyticsState {
  intro_first_need: IntroFirstNeed;
  seller_selected_items: string[];
  seller_listing_completed: boolean;
  seller_wishlist_choice: 'Notify this buyer' | 'Wait for organic interest' | '';
  seller_ai_price_decision: 'Accept suggested price' | 'Keep my price' | '';
  seller_commitment_choice: 'I would sell items here' | 'Continue exploring' | '';
  seller_interest_reasons: string[];
  buyer_selected_items: string[];
  buyer_verified_count: number;
  buyer_nonverified_count: number;
  buyer_commitment_choice: 'I would buy here' | 'Continue' | '';
  buyer_interest_reasons: string[];
  final_waitlist_email: string;
}

export const INITIAL_ANALYTICS: AnalyticsState = {
  intro_first_need: '',
  seller_selected_items: [],
  seller_listing_completed: false,
  seller_wishlist_choice: '',
  seller_ai_price_decision: '',
  seller_commitment_choice: '',
  seller_interest_reasons: [],
  buyer_selected_items: [],
  buyer_verified_count: 0,
  buyer_nonverified_count: 0,
  buyer_commitment_choice: '',
  buyer_interest_reasons: [],
  final_waitlist_email: ''
};
