package com.yourcompany.saf;

import com.getcapacitor.Logger;

public class Saf {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
