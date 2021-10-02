public class sleep {
    public void run() {
        long l1 = 0L;
        long l2 = 300000L;
        long l3 = System.currentTimeMillis();
        long l4 = 0L;
        int i = 0;
        long l5 = 0L;
        long l6 = 0L;
        long l7 = 0L;
        long l8 = System.currentTimeMillis();
        this.startTime = l8;
        while (this.running) {
            // pre game tick
            l7 += 1L;

            // post game tick
            long l10 = System.currentTimeMillis();
            l8 += this.broadcastFrequency;
            long l9 = l8 - l10;
            if (l9 < 2L) {
                l8 += 2L;
                i++;
                l5 += 2L - l9;
                if (2L - l9 > l6) {
                    l6 = 2L - l9;
                }
                l9 = 2L;
            }
            sleep(l9);
            l1 += l9;
            if ((Version.DEBUG) && (l3 + l2 < System.currentTimeMillis())
                    && (this.parameters.containsKey("param_debug"))) {
                long l11 = l7 - l4;
                float f1 = (float) l1 / (float) l11;
                float f2 = (float) l2 / (float) l11;
                float f3 = f2 - f1;
                System.out.println("Dogfight stats " + this.parameters.getString("param_name") + "; COUNT_TIME:" + f3
                        + " cycles:" + l11 + " averagePauseTime:" + f1 + " timePerCycle:" + f2 + " TOO_LOW_PAUSES:" + i
                        + " tooLowPauseTime: " + l5 + " longestPause: " + l6);
                l3 = System.currentTimeMillis();
                l4 = l7;
                l1 = 0L;
                i = 0;
                l5 = 0L;
                l6 = 0L;
            }
        }
    }
}
