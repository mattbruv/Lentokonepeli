pub struct Rng(u64);

impl Rng {
    pub fn from_str(seed: &str) -> Self {
        let mut hash: u64 = 0xcbf29ce484222325;
        for byte in seed.bytes() {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(0x100000001b3);
        }
        Rng(hash | 1)
    }

    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.0 = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    pub fn next_f64(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 / (1u64 << 53) as f64
    }

    pub fn range(&mut self, low: f64, high: f64) -> f64 {
        low + (high - low) * self.next_f64()
    }

    pub fn range_u32(&mut self, low: u32, high: u32) -> u32 {
        if high <= low {
            return low;
        }
        low + (self.next_u64() % (high - low + 1) as u64) as u32
    }

    pub fn chance(&mut self, probability: f64) -> bool {
        self.next_f64() < probability
    }
}
