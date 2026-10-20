package app.lovable.cymaticdiscipline;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DisciplineNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
