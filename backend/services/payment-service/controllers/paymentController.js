import Payment from '../models/Payment.js';
import { PaymentEvents } from '../queue/index.js';
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
    try {
        const { orderId, amount, method } = req.body;
        const customerId = req.user.userId;

        const payment = new Payment({
            orderId,
            customerId,
            amount,
            method,
            status: 'pending'
        });

        if (method === 'card') {
            // TODO: Create Stripe payment intent
            // const paymentIntent = await stripe.paymentIntents.create({
            //   amount: Math.round(amount * 100),
            //   currency: 'usd',
            //   metadata: { orderId: orderId.toString() }
            // });
            // payment.stripePaymentIntentId = paymentIntent.id;

            // For now, simulate payment intent
            payment.stripePaymentIntentId = `pi_${Date.now()}`;
        }

        await payment.save();

        res.status(201).json({
            message: 'Payment intent created',
            payment,
            clientSecret: payment.stripePaymentIntentId // In real implementation, return paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent', message: error.message });
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // TODO: Confirm with Stripe
        // if (payment.method === 'card') {
        //   const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
        //   if (paymentIntent.status !== 'succeeded') {
        //     payment.status = 'failed';
        //     payment.failureReason = 'Payment not completed';
        //     await payment.save();
        //     return res.status(400).json({ error: 'Payment failed' });
        //   }
        //   payment.stripeChargeId = paymentIntent.charges.data[0].id;
        // }

        payment.status = 'completed';
        await payment.save();

        // Publish payment completed event
        await PaymentEvents.completed({
            paymentId: payment._id,
            orderId: payment.orderId,
            customerId: payment.customerId,
            amount: payment.amount
        });

        res.json({
            message: 'Payment confirmed',
            payment
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment', message: error.message });
    }
};

export const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ error: 'Can only refund completed payments' });
        }

        // TODO: Process refund with Stripe
        // if (payment.method === 'card') {
        //   const refund = await stripe.refunds.create({
        //     charge: payment.stripeChargeId,
        //     amount: Math.round(amount * 100)
        //   });
        //   payment.refundId = refund.id;
        // }

        payment.status = 'refunded';
        payment.refundAmount = amount;
        payment.refundReason = reason;
        payment.refundId = `re_${Date.now()}`;
        await payment.save();

        // Publish refund event
        await PaymentEvents.refunded({
            paymentId: payment._id,
            orderId: payment.orderId,
            amount: amount,
            reason
        });

        res.json({
            message: 'Refund processed',
            payment
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ error: 'Failed to process refund', message: error.message });
    }
};

export const getPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({ payment });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Failed to get payment', message: error.message });
    }
};

export const stripeWebhook = async (req, res) => {
    try {
        // TODO: Verify Stripe webhook signature
        // const sig = req.headers['stripe-signature'];
        // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        // Handle webhook events
        // switch (event.type) {
        //   case 'payment_intent.succeeded':
        //     // Handle successful payment
        //     break;
        //   case 'payment_intent.payment_failed':
        //     // Handle failed payment
        //     break;
        // }

        res.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
};
