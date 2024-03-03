pub mod man {
    use dogfight_macros::lento_test;
    use ts_rs::TS;
    #[ts(export)]
    pub struct ManState {
        x: i16,
        y: i16,
    }
    impl ts_rs::TS for ManState {
        const EXPORT_TO: Option<&'static str> = Some("bindings/ManState.ts");
        fn decl() -> String {
            {
                let res = ::alloc::fmt::format(
                    format_args!("interface {0}{1} {2}", "ManState", "", Self::inline()),
                );
                res
            }
        }
        fn name() -> String {
            "ManState".to_owned()
        }
        fn inline() -> String {
            {
                let res = ::alloc::fmt::format(
                    format_args!(
                        "{{ {0} }}",
                        <[String]>::join(
                            &[
                                {
                                    let res = ::alloc::fmt::format(
                                        format_args!(
                                            "{0}{1}: {2},",
                                            "x",
                                            "",
                                            <i16 as ts_rs::TS>::name(),
                                        ),
                                    );
                                    res
                                },
                                {
                                    let res = ::alloc::fmt::format(
                                        format_args!(
                                            "{0}{1}: {2},",
                                            "y",
                                            "",
                                            <i16 as ts_rs::TS>::name(),
                                        ),
                                    );
                                    res
                                },
                            ],
                            " ",
                        ),
                    ),
                );
                res
            }
        }
        fn inline_flattened() -> String {
            <[String]>::join(
                &[
                    {
                        let res = ::alloc::fmt::format(
                            format_args!(
                                "{0}{1}: {2},",
                                "x",
                                "",
                                <i16 as ts_rs::TS>::name(),
                            ),
                        );
                        res
                    },
                    {
                        let res = ::alloc::fmt::format(
                            format_args!(
                                "{0}{1}: {2},",
                                "y",
                                "",
                                <i16 as ts_rs::TS>::name(),
                            ),
                        );
                        res
                    },
                ],
                " ",
            )
        }
        fn dependencies() -> Vec<ts_rs::Dependency>
        where
            Self: 'static,
        {
            {
                let mut dependencies = Vec::new();
                if <i16 as ts_rs::TS>::transparent() {
                    dependencies.append(&mut <i16 as ts_rs::TS>::dependencies());
                } else {
                    if let Some(dep) = ts_rs::Dependency::from_ty::<i16>() {
                        dependencies.push(dep);
                    }
                }
                if <i16 as ts_rs::TS>::transparent() {
                    dependencies.append(&mut <i16 as ts_rs::TS>::dependencies());
                } else {
                    if let Some(dep) = ts_rs::Dependency::from_ty::<i16>() {
                        dependencies.push(dep);
                    }
                }
                dependencies
            }
        }
        fn transparent() -> bool {
            false
        }
    }
    pub struct Man {
        x: i16,
        y: i16,
        client: ManState,
    }
}
