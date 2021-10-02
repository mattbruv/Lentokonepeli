public class sleep {
    public void run() {
        long l1 = 0L;
        long DEBUG_PRINT_INTERVAL = 300000L;
        long LAST_PRINT_TIME = System.currentTimeMillis();
        long l4 = 0L;
        int TOO_LOW_PAUSES = 0;
        long tooLowPauseTime = 0L;
        long longestPause = 0L;
        long GAME_TICK_COUNTER = 0L;
        long l8 = System.currentTimeMillis();
        this.startTime = l8;
        while (this.running) {
            // pre game tick
            GAME_TICK_COUNTER += 1L;

            // post game tick
            long TIME_AFTER_TICK = System.currentTimeMillis();
            l8 += this.broadcastFrequency;
            long l9 = l8 - TIME_AFTER_TICK;

            // Only true if game logic took longer than expected
            if (l9 < 2L) {
                l8 += 2L;
                TOO_LOW_PAUSES++;
                tooLowPauseTime += 2L - l9;
                if (2L - l9 > longestPause) {
                    longestPause = 2L - l9;
                }
                l9 = 2L;
            }

            sleep(l9);

            l1 += l9;

            if ((Version.DEBUG) && (LAST_PRINT_TIME + DEBUG_PRINT_INTERVAL < System.currentTimeMillis())
                    && (this.parameters.containsKey("param_debug"))) {
                long CYCLES = GAME_TICK_COUNTER - l4;
                float averagePauseTime = (float) l1 / (float) CYCLES;
                float timePerCycle = (float) DEBUG_PRINT_INTERVAL / (float) CYCLES;
                float COUNT_TIME = timePerCycle - averagePauseTime;
                System.out.println("Dogfight stats " + this.parameters.getString("param_name") + "; COUNT_TIME:"
                        + COUNT_TIME + " cycles:" + CYCLES + " averagePauseTime:" + averagePauseTime + " timePerCycle:"
                        + timePerCycle + " TOO_LOW_PAUSES:" + TOO_LOW_PAUSES + " tooLowPauseTime: " + tooLowPauseTime
                        + " longestPause: " + longestPause);
                LAST_PRINT_TIME = System.currentTimeMillis();
                l4 = GAME_TICK_COUNTER;
                l1 = 0L;
                TOO_LOW_PAUSES = 0;
                tooLowPauseTime = 0L;
                longestPause = 0L;
            }
        }
    }
}
