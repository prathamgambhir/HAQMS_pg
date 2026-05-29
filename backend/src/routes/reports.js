const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0); //sets time to midnight 12

    // 1. Fetch EVERYTHING we need in a single database query using Prisma aggregations
    const doctorsWithStats = await prisma.doctor.findMany({
      include: {
        // Automatically count associated records at the database level
        appointments: {
          select: {
            status: true,
          },
        },
        // Count tokens filtered by date constraint directly inside the database query
        queueTokens: {
          where: {
            createdAt: { gte: today },
          },
          select: {
            id: true,
          },
        },
      },
    });

    // 2. Format the retrieved database records into our clean output structure
    const reportData = doctorsWithStats.map((doc) => {
      // Filter out appointment subsets from our single pre-fetched in-memory array block
      const totalAppointments = doc.appointments.length;
      
      const completedAppointments = doc.appointments.filter(
        (app) => app.status === 'COMPLETED'
      ).length;
      
      const cancelledAppointments = doc.appointments.filter(
        (app) => app.status === 'CANCELLED'
      ).length;

      // Calculate revenue directly using the total completed count
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize: doc.queueTokens.length,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
