import React from 'react';
import { 
  Navigation, 
  Coffee, 
  User, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  X, 
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Car
} from 'lucide-react';
import { Order } from '../types';

export interface ActiveJobWorkflowCardProps {
  order: Order;
  distanceToTarget: string;
  isNavigating: boolean;
  onNextStep: (orderId: string) => void;
  onNavigateToggle: (order: Order) => void;
  onOpenChat: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  theme?: string;
}

// Maps order status to 1-7 workflow stage index and metadata
export function getWorkflowStage(order: Order) {
  const isRide = order.type === 'ride';
  const status = order.status;

  if (status === 'accepted') {
    return {
      stageNumber: 1,
      totalStages: 7,
      stageKey: 'accepted',
      stageTitle: 'Job Accepted',
      stepDescription: isRide ? `Pickup rider: ${order.customerName}` : `Pickup order: ${order.restaurantName}`,
      actionLabel: '1. Prepare for Pickup',
      actionColor: 'bg-blue-600 hover:bg-blue-500',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      phase: 'pickup' as const
    };
  }

  if (status === 'preparing_pickup') {
    return {
      stageNumber: 2,
      totalStages: 7,
      stageKey: 'preparing_pickup',
      stageTitle: 'Prepare for Pickup',
      stepDescription: isRide ? `Review pickup spot for ${order.customerName}` : `Review order items at ${order.restaurantName}`,
      actionLabel: '2. Start Navigation to Pickup',
      actionColor: 'bg-indigo-600 hover:bg-indigo-500',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      phase: 'pickup' as const
    };
  }

  if (status === 'en_route_to_pickup') {
    return {
      stageNumber: 3,
      totalStages: 7,
      stageKey: 'en_route_to_pickup',
      stageTitle: 'Navigate to Pickup',
      stepDescription: isRide ? `En route to pickup ${order.customerName}` : `En route to ${order.restaurantName}`,
      actionLabel: '3. Confirm Arrived at Pickup',
      actionColor: 'bg-purple-600 hover:bg-purple-500',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      phase: 'pickup' as const
    };
  }

  if (status === 'arrived_at_pickup' || status === 'arriving') {
    return {
      stageNumber: 4,
      totalStages: 7,
      stageKey: 'arrived_at_pickup',
      stageTitle: 'Arrived at Pickup',
      stepDescription: isRide ? `At pickup location. Waiting for ${order.customerName}` : `At ${order.restaurantName}. Collect packages`,
      actionLabel: isRide ? '4. Confirm Passenger on Board' : '4. Confirm Order Collected',
      actionColor: 'bg-amber-600 hover:bg-amber-500',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      phase: 'pickup' as const
    };
  }

  if (status === 'picked_up' || status === 'scanning_receipt') {
    return {
      stageNumber: 5,
      totalStages: 7,
      stageKey: 'picked_up',
      stageTitle: 'Confirm Pickup',
      stepDescription: isRide ? `${order.customerName} safely on board` : `Items secured. Ready for delivery route`,
      actionLabel: '5. Navigate to Destination',
      actionColor: 'bg-emerald-600 hover:bg-emerald-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      phase: 'dropoff' as const
    };
  }

  if (status === 'on_ride') {
    return {
      stageNumber: 6,
      totalStages: 7,
      stageKey: 'on_ride',
      stageTitle: 'Navigate to Destination',
      stepDescription: isRide ? `Driving to dropoff for ${order.customerName}` : `Delivering to ${order.customerName}`,
      actionLabel: '6. Arrived at Destination',
      actionColor: 'bg-blue-600 hover:bg-blue-500',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      phase: 'dropoff' as const
    };
  }

  // Final Stage 7: Arrived at dropoff / ready to complete
  return {
    stageNumber: 7,
    totalStages: 7,
    stageKey: 'arrived',
    stageTitle: 'Complete Job',
    stepDescription: isRide ? `Drop off ${order.customerName} safely` : `Hand over delivery to ${order.customerName}`,
    actionLabel: `7. Complete Job • Collect £${order.estimatedPay.toFixed(2)}`,
    actionColor: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/40 font-black',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    phase: 'dropoff' as const
  };
}

export const ActiveJobWorkflowCard: React.FC<ActiveJobWorkflowCardProps> = ({
  order,
  distanceToTarget,
  isNavigating,
  onNextStep,
  onNavigateToggle,
  onOpenChat,
  onCancel,
  onViewDetails,
  theme = 'dark'
}) => {
  const isRide = order.type === 'ride';
  const stage = getWorkflowStage(order);

  return (
    <div 
      className={`rounded-3xl shadow-2xl p-4 sm:p-5 border pointer-events-auto backdrop-blur-xl transition-all ${
        theme === 'dark' 
          ? 'bg-[#0e121e]/95 border-blue-500/30 text-white shadow-blue-950/40' 
          : 'bg-white/95 border-gray-200 text-neutral-900 shadow-xl'
      }`}
    >
      {/* 1. Header Row: 7-Stage Indicator & Pay */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stage.badgeColor}`}>
            Stage {stage.stageNumber} of 7 • {stage.stageTitle}
          </span>
          <span className="text-[10px] font-mono font-bold text-gray-400">
            {distanceToTarget} mi away
          </span>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-emerald-400 font-mono">
            £{order.estimatedPay.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 2. Visual 7-Segment Progress Bar */}
      <div className="grid grid-cols-7 gap-1 mb-3.5">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
          const isDone = num < stage.stageNumber;
          const isCurrent = num === stage.stageNumber;
          return (
            <div 
              key={`stage-bar-${num}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isDone 
                  ? 'bg-emerald-400' 
                  : isCurrent 
                  ? 'bg-blue-500 animate-pulse ring-1 ring-blue-400' 
                  : 'bg-white/10'
              }`}
            />
          );
        })}
      </div>

      {/* 3. Main Target Entity Info */}
      <div 
        onClick={() => onViewDetails(order.id)}
        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors mb-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            {isRide ? <User size={20} /> : <Coffee size={20} />}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black truncate text-white leading-tight">
              {stage.phase === 'pickup'
                ? (isRide ? order.customerName : order.restaurantName)
                : order.customerName
              }
            </h4>
            <p className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
              {stage.stepDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400 hover:text-white shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Details</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* 4. Action Buttons Row */}
      <div className="flex items-center gap-2">
        {/* Chat Button */}
        <button
          onClick={() => onOpenChat(order.id)}
          className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
          title="Chat with Customer"
        >
          <MessageSquare size={17} />
        </button>

        {/* Navigation Mode Button */}
        <button
          onClick={() => onNavigateToggle(order)}
          className={`h-11 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer border ${
            isNavigating 
              ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm' 
              : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
          }`}
          title={isNavigating ? "Navigation Active (Turn by Turn)" : "Start Turn by Turn Navigation"}
        >
          <Navigation size={14} className={isNavigating ? 'animate-pulse text-purple-400' : ''} />
          <span className="hidden sm:inline">{isNavigating ? 'Nav Active' : 'Directions'}</span>
        </button>

        {/* Primary 1-Tap Stage Advancement Button */}
        <button
          onClick={() => onNextStep(order.id)}
          className={`flex-1 h-11 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${stage.actionColor}`}
        >
          <span>{stage.actionLabel}</span>
          <ChevronRight size={16} />
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => onCancel(order.id)}
          className="w-11 h-11 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
          title="Cancel Trip"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
};
